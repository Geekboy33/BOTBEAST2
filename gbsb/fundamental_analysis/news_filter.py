"""
Módulo de filtro de noticias para análisis fundamental
Integra múltiples fuentes de noticias y análisis de sentimiento
"""

import asyncio
import aiohttp
import logging
from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import re
import json
from urllib.parse import urljoin, urlparse
import feedparser
import nltk
from textblob import TextBlob
import requests
from bs4 import BeautifulSoup

class NewsSource(Enum):
    """Fuentes de noticias"""
    COINDESK = "coindesk"
    COINTELEGRAPH = "cointelegraph"
    BLOOMBERG = "bloomberg"
    REUTERS = "reuters"
    TWITTER = "twitter"
    REDDIT = "reddit"
    YOUTUBE = "youtube"
    TELEGRAM = "telegram"

class NewsCategory(Enum):
    """Categorías de noticias"""
    REGULATION = "regulation"
    TECHNOLOGY = "technology"
    MARKET = "market"
    ADOPTION = "adoption"
    SECURITY = "security"
    PARTNERSHIP = "partnership"
    FUNDING = "funding"
    GENERAL = "general"

class SentimentScore(Enum):
    """Scores de sentimiento"""
    VERY_BEARISH = -2
    BEARISH = -1
    NEUTRAL = 0
    BULLISH = 1
    VERY_BULLISH = 2

@dataclass
class NewsArticle:
    """Artículo de noticias"""
    title: str
    content: str
    summary: str
    source: NewsSource
    category: NewsCategory
    sentiment_score: SentimentScore
    sentiment_confidence: float
    keywords: List[str]
    symbols: List[str]  # Criptomonedas mencionadas
    url: str
    published_at: datetime
    relevance_score: float  # 0-1
    impact_score: float  # 0-1
    credibility_score: float  # 0-1
    engagement_metrics: Dict[str, int] = field(default_factory=dict)

@dataclass
class MarketSentiment:
    """Sentimiento del mercado"""
    overall_sentiment: SentimentScore
    sentiment_score: float  # -1 a 1
    confidence: float  # 0-1
    category_sentiments: Dict[NewsCategory, float]
    symbol_sentiments: Dict[str, float]
    trending_topics: List[str]
    key_events: List[str]
    last_updated: datetime

@dataclass
class NewsFilter:
    """Filtro de noticias"""
    enabled_sources: List[NewsSource]
    enabled_categories: List[NewsCategory]
    min_relevance_score: float
    min_credibility_score: float
    max_age_hours: int
    keywords_include: List[str]
    keywords_exclude: List[str]
    symbols_filter: List[str]
    sentiment_threshold: float
    max_articles_per_source: int

class NewsAnalyzer:
    """Analizador de noticias y sentimiento"""
    
    def __init__(self, config: NewsFilter):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Cache de noticias
        self.news_cache: List[NewsArticle] = []
        self.sentiment_cache: Dict[str, MarketSentiment] = {}
        
        # Configuración de fuentes
        self.source_configs = self._setup_source_configs()
        
        # Palabras clave por categoría
        self.category_keywords = self._setup_category_keywords()
        
        # Símbolos de criptomonedas
        self.crypto_symbols = self._setup_crypto_symbols()
        
        # Sesión HTTP
        self.session: Optional[aiohttp.ClientSession] = None
    
    def _setup_source_configs(self) -> Dict[NewsSource, Dict[str, Any]]:
        """Configuración de fuentes de noticias"""
        return {
            NewsSource.COINDESK: {
                'rss_url': 'https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml',
                'api_url': 'https://www.coindesk.com/api/v1/news',
                'base_url': 'https://www.coindesk.com',
                'credibility': 0.9
            },
            NewsSource.COINTELEGRAPH: {
                'rss_url': 'https://cointelegraph.com/rss',
                'api_url': 'https://cointelegraph.com/api/v1/news',
                'base_url': 'https://cointelegraph.com',
                'credibility': 0.85
            },
            NewsSource.BLOOMBERG: {
                'rss_url': 'https://feeds.bloomberg.com/markets/news.rss',
                'api_url': 'https://www.bloomberg.com/api/news',
                'base_url': 'https://www.bloomberg.com',
                'credibility': 0.95
            },
            NewsSource.REUTERS: {
                'rss_url': 'https://feeds.reuters.com/reuters/businessNews',
                'api_url': 'https://www.reuters.com/api/news',
                'base_url': 'https://www.reuters.com',
                'credibility': 0.95
            }
        }
    
    def _setup_category_keywords(self) -> Dict[NewsCategory, List[str]]:
        """Palabras clave por categoría"""
        return {
            NewsCategory.REGULATION: [
                'regulation', 'regulatory', 'sec', 'cftc', 'fincen', 'ban', 'legal',
                'compliance', 'lawsuit', 'court', 'government', 'policy'
            ],
            NewsCategory.TECHNOLOGY: [
                'upgrade', 'fork', 'consensus', 'blockchain', 'defi', 'nft',
                'smart contract', 'protocol', 'network', 'mainnet', 'testnet'
            ],
            NewsCategory.MARKET: [
                'price', 'market', 'trading', 'volume', 'bullish', 'bearish',
                'rally', 'crash', 'correction', 'volatility', 'liquidity'
            ],
            NewsCategory.ADOPTION: [
                'adoption', 'partnership', 'integration', 'payment', 'merchant',
                'institution', 'corporate', 'enterprise', 'mass adoption'
            ],
            NewsCategory.SECURITY: [
                'hack', 'security', 'breach', 'exploit', 'vulnerability',
                'audit', 'bug', 'attack', 'theft', 'stolen'
            ],
            NewsCategory.PARTNERSHIP: [
                'partnership', 'collaboration', 'deal', 'agreement',
                'alliance', 'integration', 'support'
            ],
            NewsCategory.FUNDING: [
                'funding', 'investment', 'raise', 'ipo', 'acquisition',
                'venture', 'capital', 'fund', 'series'
            ]
        }
    
    def _setup_crypto_symbols(self) -> Dict[str, List[str]]:
        """Símbolos y nombres de criptomonedas"""
        return {
            'BTC': ['bitcoin', 'btc'],
            'ETH': ['ethereum', 'eth', 'ether'],
            'BNB': ['binance coin', 'bnb'],
            'ADA': ['cardano', 'ada'],
            'SOL': ['solana', 'sol'],
            'DOT': ['polkadot', 'dot'],
            'MATIC': ['polygon', 'matic'],
            'AVAX': ['avalanche', 'avax'],
            'LINK': ['chainlink', 'link'],
            'UNI': ['uniswap', 'uni'],
            'LTC': ['litecoin', 'ltc'],
            'XRP': ['ripple', 'xrp'],
            'DOGE': ['dogecoin', 'doge'],
            'SHIB': ['shiba inu', 'shib'],
            'USDT': ['tether', 'usdt'],
            'USDC': ['usd coin', 'usdc']
        }
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def fetch_all_news(self) -> List[NewsArticle]:
        """Obtiene noticias de todas las fuentes habilitadas"""
        all_articles = []
        
        tasks = []
        for source in self.config.enabled_sources:
            if source in self.source_configs:
                task = self._fetch_news_from_source(source)
                tasks.append(task)
        
        # Ejecutar en paralelo
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, Exception):
                self.logger.error(f"Error obteniendo noticias: {result}")
            elif result:
                all_articles.extend(result)
        
        # Filtrar y procesar artículos
        filtered_articles = self._filter_articles(all_articles)
        processed_articles = await self._process_articles(filtered_articles)
        
        # Actualizar cache
        self.news_cache = processed_articles
        
        self.logger.info(f"Obtenidas {len(processed_articles)} noticias relevantes")
        return processed_articles
    
    async def _fetch_news_from_source(self, source: NewsSource) -> List[NewsArticle]:
        """Obtiene noticias de una fuente específica"""
        try:
            config = self.source_configs[source]
            
            if source in [NewsSource.COINDESK, NewsSource.COINTELEGRAPH, NewsSource.BLOOMBERG, NewsSource.REUTERS]:
                return await self._fetch_rss_news(source, config)
            elif source == NewsSource.TWITTER:
                return await self._fetch_twitter_news(source, config)
            elif source == NewsSource.REDDIT:
                return await self._fetch_reddit_news(source, config)
            else:
                return []
                
        except Exception as e:
            self.logger.error(f"Error obteniendo noticias de {source.value}: {e}")
            return []
    
    async def _fetch_rss_news(self, source: NewsSource, config: Dict[str, Any]) -> List[NewsArticle]:
        """Obtiene noticias desde RSS"""
        articles = []
        
        try:
            async with self.session.get(config['rss_url']) as response:
                if response.status == 200:
                    content = await response.text()
                    feed = feedparser.parse(content)
                    
                    for entry in feed.entries[:self.config.max_articles_per_source]:
                        # Extraer contenido
                        title = entry.get('title', '')
                        summary = entry.get('summary', '')
                        link = entry.get('link', '')
                        published = entry.get('published_parsed', None)
                        
                        if published:
                            published_at = datetime(*published[:6])
                        else:
                            published_at = datetime.now()
                        
                        # Verificar edad
                        if (datetime.now() - published_at).total_seconds() > self.config.max_age_hours * 3600:
                            continue
                        
                        # Obtener contenido completo
                        content = await self._fetch_article_content(link, config['base_url'])
                        
                        article = NewsArticle(
                            title=title,
                            content=content,
                            summary=summary,
                            source=source,
                            category=NewsCategory.GENERAL,  # Se categorizará después
                            sentiment_score=SentimentScore.NEUTRAL,  # Se analizará después
                            sentiment_confidence=0.0,
                            keywords=[],
                            symbols=[],
                            url=link,
                            published_at=published_at,
                            relevance_score=0.0,
                            impact_score=0.0,
                            credibility_score=config.get('credibility', 0.5)
                        )
                        
                        articles.append(article)
                        
        except Exception as e:
            self.logger.error(f"Error parseando RSS de {source.value}: {e}")
        
        return articles
    
    async def _fetch_article_content(self, url: str, base_url: str) -> str:
        """Obtiene contenido completo del artículo"""
        try:
            full_url = urljoin(base_url, url)
            async with self.session.get(full_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Extraer contenido del artículo
                    content_selectors = [
                        'article', '.article-content', '.post-content', 
                        '.entry-content', '.content', 'main'
                    ]
                    
                    content = ""
                    for selector in content_selectors:
                        element = soup.select_one(selector)
                        if element:
                            content = element.get_text(strip=True)
                            break
                    
                    return content[:5000]  # Limitar a 5000 caracteres
                    
        except Exception as e:
            self.logger.warning(f"Error obteniendo contenido de {url}: {e}")
        
        return ""
    
    async def _fetch_twitter_news(self, source: NewsSource, config: Dict[str, Any]) -> List[NewsArticle]:
        """Obtiene noticias de Twitter (simulado)"""
        # En implementación real, usarías Twitter API
        # Por ahora, simulamos algunos tweets relevantes
        articles = []
        
        # Simular tweets de crypto influencers
        tweets = [
            {
                'title': 'Bitcoin reaches new ATH as institutional adoption grows',
                'content': 'Bitcoin has reached a new all-time high amid growing institutional adoption...',
                'author': '@crypto_analyst',
                'published_at': datetime.now() - timedelta(hours=2)
            },
            {
                'title': 'Ethereum 2.0 upgrade shows promising results',
                'content': 'The latest Ethereum upgrade is showing promising results with improved scalability...',
                'author': '@eth_dev',
                'published_at': datetime.now() - timedelta(hours=4)
            }
        ]
        
        for tweet in tweets:
            article = NewsArticle(
                title=tweet['title'],
                content=tweet['content'],
                summary=tweet['content'][:200],
                source=source,
                category=NewsCategory.GENERAL,
                sentiment_score=SentimentScore.NEUTRAL,
                sentiment_confidence=0.0,
                keywords=[],
                symbols=[],
                url=f"https://twitter.com{tweet['author']}",
                published_at=tweet['published_at'],
                relevance_score=0.0,
                impact_score=0.0,
                credibility_score=0.7
            )
            articles.append(article)
        
        return articles
    
    async def _fetch_reddit_news(self, source: NewsSource, config: Dict[str, Any]) -> List[NewsArticle]:
        """Obtiene noticias de Reddit (simulado)"""
        # En implementación real, usarías Reddit API
        articles = []
        
        # Simular posts de Reddit
        posts = [
            {
                'title': 'Major crypto exchange announces new features',
                'content': 'A major cryptocurrency exchange has announced several new features...',
                'subreddit': 'r/CryptoCurrency',
                'published_at': datetime.now() - timedelta(hours=1)
            }
        ]
        
        for post in posts:
            article = NewsArticle(
                title=post['title'],
                content=post['content'],
                summary=post['content'][:200],
                source=source,
                category=NewsCategory.GENERAL,
                sentiment_score=SentimentScore.NEUTRAL,
                sentiment_confidence=0.0,
                keywords=[],
                symbols=[],
                url=f"https://reddit.com{post['subreddit']}",
                published_at=post['published_at'],
                relevance_score=0.0,
                impact_score=0.0,
                credibility_score=0.6
            )
            articles.append(article)
        
        return articles
    
    def _filter_articles(self, articles: List[NewsArticle]) -> List[NewsArticle]:
        """Filtra artículos según criterios"""
        filtered = []
        
        for article in articles:
            # Verificar edad
            age_hours = (datetime.now() - article.published_at).total_seconds() / 3600
            if age_hours > self.config.max_age_hours:
                continue
            
            # Verificar credibilidad mínima
            if article.credibility_score < self.config.min_credibility_score:
                continue
            
            # Verificar palabras clave incluidas
            if self.config.keywords_include:
                text = (article.title + ' ' + article.content).lower()
                if not any(keyword.lower() in text for keyword in self.config.keywords_include):
                    continue
            
            # Verificar palabras clave excluidas
            if self.config.keywords_exclude:
                text = (article.title + ' ' + article.content).lower()
                if any(keyword.lower() in text for keyword in self.config.keywords_exclude):
                    continue
            
            filtered.append(article)
        
        return filtered
    
    async def _process_articles(self, articles: List[NewsArticle]) -> List[NewsArticle]:
        """Procesa artículos (categorización, sentimiento, etc.)"""
        processed = []
        
        for article in articles:
            # Categorizar
            article.category = self._categorize_article(article)
            
            # Extraer símbolos
            article.symbols = self._extract_symbols(article)
            
            # Analizar sentimiento
            sentiment_result = self._analyze_sentiment(article)
            article.sentiment_score = sentiment_result['score']
            article.sentiment_confidence = sentiment_result['confidence']
            
            # Extraer palabras clave
            article.keywords = self._extract_keywords(article)
            
            # Calcular scores
            article.relevance_score = self._calculate_relevance_score(article)
            article.impact_score = self._calculate_impact_score(article)
            
            processed.append(article)
        
        return processed
    
    def _categorize_article(self, article: NewsArticle) -> NewsCategory:
        """Categoriza un artículo"""
        text = (article.title + ' ' + article.content).lower()
        
        category_scores = {}
        for category, keywords in self.category_keywords.items():
            score = sum(1 for keyword in keywords if keyword.lower() in text)
            category_scores[category] = score
        
        # Retornar categoría con mayor score
        if category_scores:
            best_category = max(category_scores, key=category_scores.get)
            if category_scores[best_category] > 0:
                return best_category
        
        return NewsCategory.GENERAL
    
    def _extract_symbols(self, article: NewsArticle) -> List[str]:
        """Extrae símbolos de criptomonedas del artículo"""
        text = (article.title + ' ' + article.content).lower()
        found_symbols = []
        
        for symbol, names in self.crypto_symbols.items():
            if any(name.lower() in text for name in names):
                found_symbols.append(symbol)
        
        return found_symbols
    
    def _analyze_sentiment(self, article: NewsArticle) -> Dict[str, Any]:
        """Analiza sentimiento del artículo"""
        text = article.title + ' ' + article.content
        
        # Usar TextBlob para análisis de sentimiento
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity  # -1 a 1
        subjectivity = blob.sentiment.subjectivity  # 0 a 1
        
        # Convertir a SentimentScore
        if polarity >= 0.6:
            score = SentimentScore.VERY_BULLISH
        elif polarity >= 0.2:
            score = SentimentScore.BULLISH
        elif polarity <= -0.6:
            score = SentimentScore.VERY_BEARISH
        elif polarity <= -0.2:
            score = SentimentScore.BEARISH
        else:
            score = SentimentScore.NEUTRAL
        
        # Confianza basada en subjetividad (menos subjetivo = más confiable)
        confidence = 1 - subjectivity
        
        return {
            'score': score,
            'confidence': confidence,
            'polarity': polarity,
            'subjectivity': subjectivity
        }
    
    def _extract_keywords(self, article: NewsArticle) -> List[str]:
        """Extrae palabras clave del artículo"""
        text = article.title + ' ' + article.content
        
        # Palabras clave relacionadas con crypto
        crypto_keywords = [
            'bitcoin', 'ethereum', 'cryptocurrency', 'blockchain', 'defi',
            'nft', 'trading', 'investment', 'market', 'price', 'bullish',
            'bearish', 'rally', 'crash', 'adoption', 'regulation'
        ]
        
        found_keywords = []
        text_lower = text.lower()
        
        for keyword in crypto_keywords:
            if keyword in text_lower:
                found_keywords.append(keyword)
        
        return found_keywords
    
    def _calculate_relevance_score(self, article: NewsArticle) -> float:
        """Calcula score de relevancia"""
        score = 0.0
        
        # Factor de credibilidad
        score += article.credibility_score * 0.3
        
        # Factor de categoría
        if article.category != NewsCategory.GENERAL:
            score += 0.2
        
        # Factor de símbolos
        if article.symbols:
            score += min(len(article.symbols) * 0.1, 0.3)
        
        # Factor de palabras clave
        if article.keywords:
            score += min(len(article.keywords) * 0.05, 0.2)
        
        return min(score, 1.0)
    
    def _calculate_impact_score(self, article: NewsArticle) -> float:
        """Calcula score de impacto"""
        score = 0.0
        
        # Factor de sentimiento extremo
        if article.sentiment_score in [SentimentScore.VERY_BULLISH, SentimentScore.VERY_BEARISH]:
            score += 0.3
        
        # Factor de categoría de alto impacto
        high_impact_categories = [
            NewsCategory.REGULATION, NewsCategory.SECURITY, NewsCategory.MARKET
        ]
        if article.category in high_impact_categories:
            score += 0.3
        
        # Factor de confianza en sentimiento
        score += article.sentiment_confidence * 0.2
        
        # Factor de credibilidad
        score += article.credibility_score * 0.2
        
        return min(score, 1.0)
    
    def analyze_market_sentiment(self, symbol: Optional[str] = None) -> MarketSentiment:
        """Analiza sentimiento general del mercado"""
        if not self.news_cache:
            return MarketSentiment(
                overall_sentiment=SentimentScore.NEUTRAL,
                sentiment_score=0.0,
                confidence=0.0,
                category_sentiments={},
                symbol_sentiments={},
                trending_topics=[],
                key_events=[],
                last_updated=datetime.now()
            )
        
        # Filtrar por símbolo si se especifica
        articles = self.news_cache
        if symbol:
            articles = [a for a in articles if symbol in a.symbols]
        
        # Calcular sentimiento general
        sentiment_scores = [a.sentiment_score.value for a in articles]
        sentiment_weights = [a.sentiment_confidence for a in articles]
        
        if sentiment_weights:
            weighted_sentiment = sum(s * w for s, w in zip(sentiment_scores, sentiment_weights)) / sum(sentiment_weights)
        else:
            weighted_sentiment = 0.0
        
        # Convertir a SentimentScore
        if weighted_sentiment >= 1.5:
            overall_sentiment = SentimentScore.VERY_BULLISH
        elif weighted_sentiment >= 0.5:
            overall_sentiment = SentimentScore.BULLISH
        elif weighted_sentiment <= -1.5:
            overall_sentiment = SentimentScore.VERY_BEARISH
        elif weighted_sentiment <= -0.5:
            overall_sentiment = SentimentScore.BEARISH
        else:
            overall_sentiment = SentimentScore.NEUTRAL
        
        # Calcular sentimientos por categoría
        category_sentiments = {}
        for category in NewsCategory:
            category_articles = [a for a in articles if a.category == category]
            if category_articles:
                cat_scores = [a.sentiment_score.value for a in category_articles]
                cat_weights = [a.sentiment_confidence for a in category_articles]
                if cat_weights:
                    category_sentiments[category] = sum(s * w for s, w in zip(cat_scores, cat_weights)) / sum(cat_weights)
        
        # Calcular sentimientos por símbolo
        symbol_sentiments = {}
        all_symbols = set()
        for article in articles:
            all_symbols.update(article.symbols)
        
        for sym in all_symbols:
            sym_articles = [a for a in articles if sym in a.symbols]
            if sym_articles:
                sym_scores = [a.sentiment_score.value for a in sym_articles]
                sym_weights = [a.sentiment_confidence for a in sym_articles]
                if sym_weights:
                    symbol_sentiments[sym] = sum(s * w for s, w in zip(sym_scores, sym_weights)) / sum(sym_weights)
        
        # Identificar temas trending
        trending_topics = self._get_trending_topics(articles)
        
        # Identificar eventos clave
        key_events = self._get_key_events(articles)
        
        # Calcular confianza general
        confidence = sum(a.sentiment_confidence for a in articles) / len(articles) if articles else 0.0
        
        return MarketSentiment(
            overall_sentiment=overall_sentiment,
            sentiment_score=weighted_sentiment / 2.0,  # Normalizar a -1 a 1
            confidence=confidence,
            category_sentiments=category_sentiments,
            symbol_sentiments=symbol_sentiments,
            trending_topics=trending_topics,
            key_events=key_events,
            last_updated=datetime.now()
        )
    
    def _get_trending_topics(self, articles: List[NewsArticle]) -> List[str]:
        """Identifica temas trending"""
        topic_counts = {}
        
        for article in articles:
            for keyword in article.keywords:
                topic_counts[keyword] = topic_counts.get(keyword, 0) + 1
        
        # Retornar top 5 temas
        sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
        return [topic for topic, count in sorted_topics[:5]]
    
    def _get_key_events(self, articles: List[NewsArticle]) -> List[str]:
        """Identifica eventos clave"""
        key_events = []
        
        for article in articles:
            # Eventos de alto impacto
            if (article.impact_score > 0.7 and 
                article.category in [NewsCategory.REGULATION, NewsCategory.SECURITY, NewsCategory.MARKET]):
                key_events.append(article.title)
        
        return key_events[:5]  # Top 5 eventos
    
    def get_news_summary(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        """Obtiene resumen de noticias"""
        if not self.news_cache:
            return {"error": "No hay noticias disponibles"}
        
        # Filtrar por símbolo si se especifica
        articles = self.news_cache
        if symbol:
            articles = [a for a in articles if symbol in a.symbols]
        
        # Análisis de sentimiento
        sentiment = self.analyze_market_sentiment(symbol)
        
        # Estadísticas
        total_articles = len(articles)
        bullish_articles = len([a for a in articles if a.sentiment_score.value > 0])
        bearish_articles = len([a for a in articles if a.sentiment_score.value < 0])
        
        # Categorías más mencionadas
        category_counts = {}
        for article in articles:
            category_counts[article.category] = category_counts.get(article.category, 0) + 1
        
        # Símbolos más mencionados
        symbol_counts = {}
        for article in articles:
            for symbol in article.symbols:
                symbol_counts[symbol] = symbol_counts.get(symbol, 0) + 1
        
        return {
            "total_articles": total_articles,
            "bullish_articles": bullish_articles,
            "bearish_articles": bearish_articles,
            "sentiment": {
                "overall": sentiment.overall_sentiment.value,
                "score": sentiment.sentiment_score,
                "confidence": sentiment.confidence
            },
            "top_categories": sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:3],
            "top_symbols": sorted(symbol_counts.items(), key=lambda x: x[1], reverse=True)[:5],
            "trending_topics": sentiment.trending_topics,
            "key_events": sentiment.key_events,
            "last_updated": sentiment.last_updated.isoformat()
        }

# Funciones de utilidad

def create_news_filter(config: Optional[NewsFilter] = None) -> NewsFilter:
    """Crea configuración de filtro de noticias"""
    if config is None:
        config = NewsFilter(
            enabled_sources=[NewsSource.COINDESK, NewsSource.COINTELEGRAPH, NewsSource.TWITTER],
            enabled_categories=list(NewsCategory),
            min_relevance_score=0.3,
            min_credibility_score=0.6,
            max_age_hours=24,
            keywords_include=['cryptocurrency', 'bitcoin', 'ethereum', 'blockchain', 'crypto'],
            keywords_exclude=['scam', 'fake', 'fraud'],
            symbols_filter=[],
            sentiment_threshold=0.3,
            max_articles_per_source=20
        )
    
    return config

async def quick_news_analysis(symbol: Optional[str] = None) -> Dict[str, Any]:
    """Análisis rápido de noticias"""
    config = create_news_filter()
    
    async with NewsAnalyzer(config) as analyzer:
        await analyzer.fetch_all_news()
        return analyzer.get_news_summary(symbol)



