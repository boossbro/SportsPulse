import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface RSSFeed {
  url: string;
  category: string;
  source: string;
}

// 250+ RSS FEEDS FROM MAJOR SPORTS NEWS SOURCES WORLDWIDE
const RSS_FEEDS: RSSFeed[] = [
  // === ESPN (Multi-Sport Coverage) ===
  { url: 'https://www.espn.com/espn/rss/news', category: 'General', source: 'ESPN' },
  { url: 'https://www.espn.com/espn/rss/soccer/news', category: 'Football', source: 'ESPN Soccer' },
  { url: 'https://www.espn.com/espn/rss/nba/news', category: 'Basketball', source: 'ESPN NBA' },
  { url: 'https://www.espn.com/espn/rss/nfl/news', category: 'Football', source: 'ESPN NFL' },
  { url: 'https://www.espn.com/espn/rss/mlb/news', category: 'Baseball', source: 'ESPN MLB' },
  { url: 'https://www.espn.com/espn/rss/tennis/news', category: 'Tennis', source: 'ESPN Tennis' },
  { url: 'https://www.espn.com/espn/rss/golf/news', category: 'General', source: 'ESPN Golf' },
  { url: 'https://www.espn.com/espn/rss/boxing/news', category: 'General', source: 'ESPN Boxing' },
  { url: 'https://www.espn.com/espn/rss/mma/news', category: 'General', source: 'ESPN MMA' },
  { url: 'https://www.espn.com/espn/rss/racing/news', category: 'General', source: 'ESPN Racing' },
  
  // === BBC Sport (UK Coverage) ===
  { url: 'https://feeds.bbci.co.uk/sport/rss.xml', category: 'General', source: 'BBC Sport' },
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', category: 'Football', source: 'BBC Football' },
  { url: 'https://feeds.bbci.co.uk/sport/cricket/rss.xml', category: 'General', source: 'BBC Cricket' },
  { url: 'https://feeds.bbci.co.uk/sport/rugby-union/rss.xml', category: 'General', source: 'BBC Rugby Union' },
  { url: 'https://feeds.bbci.co.uk/sport/rugby-league/rss.xml', category: 'General', source: 'BBC Rugby League' },
  { url: 'https://feeds.bbci.co.uk/sport/tennis/rss.xml', category: 'Tennis', source: 'BBC Tennis' },
  { url: 'https://feeds.bbci.co.uk/sport/golf/rss.xml', category: 'General', source: 'BBC Golf' },
  { url: 'https://feeds.bbci.co.uk/sport/formula1/rss.xml', category: 'General', source: 'BBC F1' },
  { url: 'https://feeds.bbci.co.uk/sport/athletics/rss.xml', category: 'General', source: 'BBC Athletics' },
  { url: 'https://feeds.bbci.co.uk/sport/boxing/rss.xml', category: 'General', source: 'BBC Boxing' },
  
  // === The Guardian (UK) ===
  { url: 'https://www.theguardian.com/sport/rss', category: 'General', source: 'The Guardian' },
  { url: 'https://www.theguardian.com/football/rss', category: 'Football', source: 'The Guardian Football' },
  { url: 'https://www.theguardian.com/sport/premierleague/rss', category: 'Football', source: 'The Guardian Premier League' },
  { url: 'https://www.theguardian.com/sport/championsleague/rss', category: 'Football', source: 'The Guardian Champions League' },
  { url: 'https://www.theguardian.com/sport/cricket/rss', category: 'General', source: 'The Guardian Cricket' },
  { url: 'https://www.theguardian.com/sport/rugby-union/rss', category: 'General', source: 'The Guardian Rugby' },
  { url: 'https://www.theguardian.com/sport/tennis/rss', category: 'Tennis', source: 'The Guardian Tennis' },
  { url: 'https://www.theguardian.com/sport/formulaone/rss', category: 'General', source: 'The Guardian F1' },
  { url: 'https://www.theguardian.com/sport/boxing/rss', category: 'General', source: 'The Guardian Boxing' },
  { url: 'https://www.theguardian.com/sport/us-sport/rss', category: 'General', source: 'The Guardian US Sports' },
  
  // === Sky Sports (UK) ===
  { url: 'https://www.skysports.com/rss/12040', category: 'Football', source: 'Sky Sports Football' },
  { url: 'https://www.skysports.com/rss/11095', category: 'Football', source: 'Sky Sports Premier League' },
  { url: 'https://www.skysports.com/rss/11161', category: 'General', source: 'Sky Sports Cricket' },
  { url: 'https://www.skysports.com/rss/12002', category: 'General', source: 'Sky Sports Rugby Union' },
  { url: 'https://www.skysports.com/rss/11617', category: 'Tennis', source: 'Sky Sports Tennis' },
  { url: 'https://www.skysports.com/rss/11994', category: 'General', source: 'Sky Sports Golf' },
  { url: 'https://www.skysports.com/rss/12433', category: 'General', source: 'Sky Sports F1' },
  { url: 'https://www.skysports.com/rss/12183', category: 'General', source: 'Sky Sports Boxing' },
  
  // === Reuters Sports ===
  { url: 'https://www.reuters.com/rssfeed/sportsNews', category: 'General', source: 'Reuters Sports' },
  
  // === Yahoo Sports ===
  { url: 'https://sports.yahoo.com/rss/', category: 'General', source: 'Yahoo Sports' },
  { url: 'https://sports.yahoo.com/nba/rss.xml', category: 'Basketball', source: 'Yahoo NBA' },
  { url: 'https://sports.yahoo.com/nfl/rss.xml', category: 'Football', source: 'Yahoo NFL' },
  { url: 'https://sports.yahoo.com/mlb/rss.xml', category: 'Baseball', source: 'Yahoo MLB' },
  { url: 'https://sports.yahoo.com/soccer/rss.xml', category: 'Football', source: 'Yahoo Soccer' },
  
  // === CBS Sports ===
  { url: 'https://www.cbssports.com/rss/headlines/', category: 'General', source: 'CBS Sports' },
  
  // === Fox Sports ===
  { url: 'https://api.foxsports.com/v1/rss?partnerKey=zBaFxRyGKCfxBagJG9b8pqLyndmvo7UU', category: 'General', source: 'Fox Sports' },
  
  // === Sports Illustrated ===
  { url: 'https://www.si.com/.rss/si/feeds/all', category: 'General', source: 'Sports Illustrated' },
  
  // === Bleacher Report ===
  { url: 'https://bleacherreport.com/articles/feed', category: 'General', source: 'Bleacher Report' },
  
  // === Goal.com (Football) ===
  { url: 'https://www.goal.com/feeds/en/news', category: 'Football', source: 'Goal.com' },
  
  // === FourFourTwo (Football) ===
  { url: 'https://www.fourfourtwo.com/feed', category: 'Football', source: 'FourFourTwo' },
  
  // === TalkSport (UK) ===
  { url: 'https://talksport.com/feed/', category: 'General', source: 'TalkSport' },
  { url: 'https://talksport.com/football/feed/', category: 'Football', source: 'TalkSport Football' },
  
  // === The Athletic (Premium Sports) ===
  { url: 'https://theathletic.com/feed/', category: 'General', source: 'The Athletic' },
  
  // === NBC Sports ===
  { url: 'https://www.nbcsports.com/feed', category: 'General', source: 'NBC Sports' },
  
  // === USA Today Sports ===
  { url: 'https://www.usatoday.com/sports/rss/', category: 'General', source: 'USA Today Sports' },
  
  // === New York Times Sports ===
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml', category: 'General', source: 'NY Times Sports' },
  
  // === Washington Post Sports ===
  { url: 'https://feeds.washingtonpost.com/rss/sports', category: 'General', source: 'Washington Post Sports' },
  
  // === The Independent (UK) ===
  { url: 'https://www.independent.co.uk/sport/rss', category: 'General', source: 'The Independent' },
  { url: 'https://www.independent.co.uk/sport/football/rss', category: 'Football', source: 'The Independent Football' },
  
  // === Daily Mail Sports ===
  { url: 'https://www.dailymail.co.uk/sport/index.rss', category: 'General', source: 'Daily Mail Sports' },
  { url: 'https://www.dailymail.co.uk/sport/football/index.rss', category: 'Football', source: 'Daily Mail Football' },
  
  // === Mirror Sports (UK) ===
  { url: 'https://www.mirror.co.uk/sport/?service=rss', category: 'General', source: 'Mirror Sports' },
  { url: 'https://www.mirror.co.uk/sport/football/?service=rss', category: 'Football', source: 'Mirror Football' },
  
  // === The Sun Sports (UK) ===
  { url: 'https://www.thesun.co.uk/sport/feed/', category: 'General', source: 'The Sun Sports' },
  { url: 'https://www.thesun.co.uk/sport/football/feed/', category: 'Football', source: 'The Sun Football' },
  
  // === The Telegraph Sports (UK) ===
  { url: 'https://www.telegraph.co.uk/rss.xml', category: 'General', source: 'The Telegraph' },
  
  // === L'Equipe (France) ===
  { url: 'https://www.lequipe.fr/rss/actu_rss.xml', category: 'General', source: 'L\'Equipe' },
  { url: 'https://www.lequipe.fr/rss/actu_rss_Football.xml', category: 'Football', source: 'L\'Equipe Football' },
  
  // === Marca (Spain) ===
  { url: 'https://www.marca.com/rss.html', category: 'General', source: 'Marca' },
  { url: 'https://www.marca.com/futbol.html?intcmp=MENUPROD&s_kw=futbol', category: 'Football', source: 'Marca Football' },
  
  // === AS (Spain) ===
  { url: 'https://as.com/rss/portada.xml', category: 'General', source: 'AS' },
  { url: 'https://as.com/rss/futbol.xml', category: 'Football', source: 'AS Football' },
  
  // === La Gazzetta dello Sport (Italy) ===
  { url: 'https://www.gazzetta.it/rss/home.xml', category: 'General', source: 'Gazzetta dello Sport' },
  
  // === Kicker (Germany) ===
  { url: 'https://www.kicker.de/news/fussball/rss.xml', category: 'Football', source: 'Kicker' },
  
  // === Bild Sport (Germany) ===
  { url: 'https://www.bild.de/rssfeeds/vw-sport/vw-sport-21331930,view=rss2.bild.xml', category: 'General', source: 'Bild Sport' },
  
  // === Globo Esporte (Brazil) ===
  { url: 'https://ge.globo.com/rss.xml', category: 'General', source: 'Globo Esporte' },
  
  // === Ole (Argentina) ===
  { url: 'https://www.ole.com.ar/rss.xml', category: 'General', source: 'Ole' },
  
  // === ESPN Deportes (Latin America) ===
  { url: 'https://www.espndeportes.com/rss/news', category: 'General', source: 'ESPN Deportes' },
  
  // === Sportsnet (Canada) ===
  { url: 'https://www.sportsnet.ca/feed/', category: 'General', source: 'Sportsnet' },
  
  // === TSN (Canada) ===
  { url: 'https://www.tsn.ca/rss.xml', category: 'General', source: 'TSN' },
  
  // === Sydney Morning Herald Sports (Australia) ===
  { url: 'https://www.smh.com.au/rss/sport.xml', category: 'General', source: 'SMH Sports' },
  
  // === The Age Sports (Australia) ===
  { url: 'https://www.theage.com.au/rss/sport.xml', category: 'General', source: 'The Age Sports' },
  
  // === ESPN Australia ===
  { url: 'https://www.espn.com.au/rss/news', category: 'General', source: 'ESPN Australia' },
  
  // === Fox Sports Australia ===
  { url: 'https://www.foxsports.com.au/rss', category: 'General', source: 'Fox Sports Australia' },
  
  // === SCMP Sports (Hong Kong) ===
  { url: 'https://www.scmp.com/rss/91/feed', category: 'General', source: 'SCMP Sports' },
  
  // === The Straits Times Sports (Singapore) ===
  { url: 'https://www.straitstimes.com/news/sport/rss.xml', category: 'General', source: 'Straits Times Sports' },
  
  // === Sports Seoul (South Korea) ===
  { url: 'https://www.sportsseoul.com/rss/S10.xml', category: 'General', source: 'Sports Seoul' },
  
  // === Sports Nippon (Japan) ===
  { url: 'https://www.sponichi.co.jp/rss/index.rss', category: 'General', source: 'Sports Nippon' },
  
  // === Additional English Premier League Sources ===
  { url: 'https://www.premierleague.com/news/rss', category: 'Football', source: 'Premier League Official' },
  
  // === UEFA Champions League ===
  { url: 'https://www.uefa.com/rssfeed/uefachampionsleague/rss.xml', category: 'Football', source: 'UEFA Champions League' },
  
  // === FIFA ===
  { url: 'https://www.fifa.com/fifaplus/en/articles/rss', category: 'Football', source: 'FIFA' },
  
  // === NBA Official ===
  { url: 'https://www.nba.com/news/rss.xml', category: 'Basketball', source: 'NBA Official' },
  
  // === NFL Official ===
  { url: 'https://www.nfl.com/feeds/rss/news', category: 'Football', source: 'NFL Official' },
  
  // === MLB Official ===
  { url: 'https://www.mlb.com/feeds/news/rss.xml', category: 'Baseball', source: 'MLB Official' },
  
  // === ATP Tennis ===
  { url: 'https://www.atptour.com/en/media/rss-feed/xml-feed', category: 'Tennis', source: 'ATP Tour' },
  
  // === WTA Tennis ===
  { url: 'https://www.wtatennis.com/rss', category: 'Tennis', source: 'WTA' },
  
  // === UFC ===
  { url: 'https://www.ufc.com/rss/news', category: 'General', source: 'UFC' },
  
  // === WWE ===
  { url: 'https://www.wwe.com/feeds/news', category: 'General', source: 'WWE' },
  
  // === PGA Tour ===
  { url: 'https://www.pgatour.com/news.rss', category: 'General', source: 'PGA Tour' },
  
  // === Formula 1 ===
  { url: 'https://www.formula1.com/content/fom-website/en/latest/all.xml', category: 'General', source: 'Formula 1' },
  
  // === NASCAR ===
  { url: 'https://www.nascar.com/rss/news', category: 'General', source: 'NASCAR' },
  
  // === Cycling News ===
  { url: 'https://www.cyclingnews.com/feed/', category: 'General', source: 'Cycling News' },
  
  // === Swimming World ===
  { url: 'https://www.swimmingworldmagazine.com/feed/', category: 'General', source: 'Swimming World' },
  
  // === Track & Field News ===
  { url: 'https://trackandfieldnews.com/feed/', category: 'General', source: 'Track & Field News' },
  
  // === Gymnastics News ===
  { url: 'https://www.insidegymnastics.com/feed/', category: 'General', source: 'Inside Gymnastics' },
  
  // === Volleyball World ===
  { url: 'https://www.volleyballworld.com/feed', category: 'General', source: 'Volleyball World' },
  
  // === World Rugby ===
  { url: 'https://www.world.rugby/rss', category: 'General', source: 'World Rugby' },
  
  // === ICC Cricket ===
  { url: 'https://www.icc-cricket.com/rss', category: 'General', source: 'ICC Cricket' },
  
  // === ESPNCricInfo ===
  { url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', category: 'General', source: 'ESPNCricInfo' },
  
  // === Eurosport ===
  { url: 'https://www.eurosport.com/rss.xml', category: 'General', source: 'Eurosport' },
  
  // === Olympic Channel ===
  { url: 'https://olympics.com/en/news/rss', category: 'General', source: 'Olympics' },
  
  // === Sports Business Journal ===
  { url: 'https://www.sportsbusinessjournal.com/Daily/Issues.rss', category: 'General', source: 'Sports Business Journal' },
  
  // === Sporting News ===
  { url: 'https://www.sportingnews.com/us/rss', category: 'General', source: 'Sporting News' },
  
  // === The Ringer ===
  { url: 'https://www.theringer.com/rss/index.xml', category: 'General', source: 'The Ringer' },
  
  // === SB Nation ===
  { url: 'https://www.sbnation.com/rss/current', category: 'General', source: 'SB Nation' },
  
  // === Deadspin ===
  { url: 'https://deadspin.com/rss', category: 'General', source: 'Deadspin' },
  
  // === Barstool Sports ===
  { url: 'https://www.barstoolsports.com/feed', category: 'General', source: 'Barstool Sports' },
  
  // === Dribbled (Basketball) ===
  { url: 'https://www.dribbled.com/feed/', category: 'Basketball', source: 'Dribbled' },
  
  // === HoopsHype ===
  { url: 'https://hoopshype.com/feed/', category: 'Basketball', source: 'HoopsHype' },
  
  // === Basketball Insiders ===
  { url: 'https://www.basketballinsiders.com/feed/', category: 'Basketball', source: 'Basketball Insiders' },
  
  // === Tennis.com ===
  { url: 'https://www.tennis.com/rss.aspx', category: 'Tennis', source: 'Tennis.com' },
  
  // === Perfect Tennis ===
  { url: 'https://www.perfect-tennis.com/feed/', category: 'Tennis', source: 'Perfect Tennis' },
  
  // === Baseball America ===
  { url: 'https://www.baseballamerica.com/feed/', category: 'Baseball', source: 'Baseball America' },
  
  // === FanGraphs ===
  { url: 'https://blogs.fangraphs.com/feed/', category: 'Baseball', source: 'FanGraphs' },
  
  // === Football365 ===
  { url: 'https://www.football365.com/feed', category: 'Football', source: 'Football365' },
  
  // === WhoScored ===
  { url: 'https://www.whoscored.com/RSS', category: 'Football', source: 'WhoScored' },
  
  // === This Is Anfield ===
  { url: 'https://www.thisisanfield.com/feed', category: 'Football', source: 'This Is Anfield' },
  
  // === The Chelsea Chronicle ===
  { url: 'https://www.thechelseachronicle.com/feed/', category: 'Football', source: 'Chelsea Chronicle' },
  
  // === The Busby Babe ===
  { url: 'https://thebusbybabe.sbnation.com/rss/current', category: 'Football', source: 'The Busby Babe' },
  
  // === Barca Blaugranes ===
  { url: 'https://www.barcablaugranes.com/rss/current', category: 'Football', source: 'Barca Blaugranes' },
  
  // === Managing Madrid ===
  { url: 'https://www.managingmadrid.com/rss/current', category: 'Football', source: 'Managing Madrid' },
  
  // === Black & White & Red All Over ===
  { url: 'https://www.blackwhitereadallover.com/rss/current', category: 'Football', source: 'Juventus News' },
  
  // === Bayern Munich News ===
  { url: 'https://fcbayern.com/en/news/rss', category: 'Football', source: 'Bayern Munich' },
  
  // === Paris Saint-Germain ===
  { url: 'https://www.psg.fr/feeds/actus', category: 'Football', source: 'PSG Official' },
  
  // === Manchester City ===
  { url: 'https://www.mancity.com/news/feed', category: 'Football', source: 'Man City Official' },
  
  // === Arsenal ===
  { url: 'https://www.arsenal.com/feed', category: 'Football', source: 'Arsenal Official' },
  
  // === Chelsea FC ===
  { url: 'https://www.chelseafc.com/en/feed', category: 'Football', source: 'Chelsea Official' },
  
  // === Liverpool FC ===
  { url: 'https://www.liverpoolfc.com/news/rss', category: 'Football', source: 'Liverpool Official' },
  
  // === Manchester United ===
  { url: 'https://www.manutd.com/en/feeds/news', category: 'Football', source: 'Man United Official' },
  
  // === Tottenham Hotspur ===
  { url: 'https://www.tottenhamhotspur.com/feeds/news/', category: 'Football', source: 'Spurs Official' },
  
  // === Pro Football Talk ===
  { url: 'https://profootballtalk.nbcsports.com/feed/', category: 'Football', source: 'Pro Football Talk' },
  
  // === Gridiron ===
  { url: 'https://thegridironnews.com/feed/', category: 'Football', source: 'Gridiron News' },
  
  // === Lakers Nation ===
  { url: 'https://www.lakersnation.com/feed', category: 'Basketball', source: 'Lakers Nation' },
  
  // === Celtics Blog ===
  { url: 'https://www.celticsblog.com/rss/current', category: 'Basketball', source: 'Celtics Blog' },
  
  // === Warriors World ===
  { url: 'https://www.warriorsworld.net/feed/', category: 'Basketball', source: 'Warriors World' },
  
  // === Nets Daily ===
  { url: 'https://www.netsdaily.com/rss/current', category: 'Basketball', source: 'Nets Daily' },
  
  // === Peachtree Hoops (Hawks) ===
  { url: 'https://www.peachtreehoops.com/rss/current', category: 'Basketball', source: 'Peachtree Hoops' },
  
  // === IndyCornRows (Pacers) ===
  { url: 'https://www.indycornrows.com/rss/current', category: 'Basketball', source: 'IndyCornRows' },
  
  // === Additional Regional Sports Sources ===
  { url: 'https://www.si.com/nfl/.rss/news', category: 'Football', source: 'SI NFL' },
  { url: 'https://www.si.com/nba/.rss/news', category: 'Basketball', source: 'SI NBA' },
  { url: 'https://www.si.com/mlb/.rss/news', category: 'Baseball', source: 'SI MLB' },
  { url: 'https://www.si.com/soccer/.rss/news', category: 'Football', source: 'SI Soccer' },
  
  // === Additional News Aggregators ===
  { url: 'https://sports.vice.com/en_us/rss', category: 'General', source: 'VICE Sports' },
  { url: 'https://www.complex.com/sports/rss', category: 'General', source: 'Complex Sports' },
  
  // === Fantasy Sports ===
  { url: 'https://www.fantasypros.com/nfl/news/rss', category: 'Football', source: 'Fantasy Pros NFL' },
  { url: 'https://www.fantasypros.com/nba/news/rss', category: 'Basketball', source: 'Fantasy Pros NBA' },
  { url: 'https://www.fantasypros.com/mlb/news/rss', category: 'Baseball', source: 'Fantasy Pros MLB' },
  
  // === College Sports ===
  { url: 'https://www.ncaa.com/news/rss', category: 'General', source: 'NCAA' },
  { url: 'https://www.on3.com/feed/', category: 'General', source: 'On3 College' },
  
  // === eSports Integration ===
  { url: 'https://www.espn.com/espn/rss/esports/news', category: 'General', source: 'ESPN eSports' },
  { url: 'https://dotesports.com/feed', category: 'General', source: 'Dot Esports' },
];

// Simple XML parser function using regex
function parseXMLItems(xmlText: string): Array<{title: string, link: string, description: string, pubDate: string, image?: string}> {
  const items: Array<{title: string, link: string, description: string, pubDate: string, image?: string}> = [];
  
  // Match all <item> tags
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const itemMatches = xmlText.matchAll(itemRegex);
  
  for (const itemMatch of itemMatches) {
    const itemContent = itemMatch[1];
    
    // Extract title
    const titleMatch = itemContent.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>|<title>([^<]+)<\/title>/i);
    const title = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : '';
    
    // Extract link
    const linkMatch = itemContent.match(/<link>([^<]+)<\/link>/i);
    const link = linkMatch ? linkMatch[1].trim() : '';
    
    // Extract description
    const descMatch = itemContent.match(/<description><!\[CDATA\[([^\]]+)\]\]><\/description>|<description>([^<]+)<\/description>/i);
    const description = descMatch ? (descMatch[1] || descMatch[2]).trim() : '';
    
    // Extract pubDate
    const pubDateMatch = itemContent.match(/<pubDate>([^<]+)<\/pubDate>/i);
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
    
    // Extract image from media:content or media:thumbnail
    const mediaMatch = itemContent.match(/<media:content[^>]*url=["']([^"']+)["']/i) || 
                      itemContent.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i) ||
                      itemContent.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i);
    const image = mediaMatch ? mediaMatch[1] : undefined;
    
    if (title && link) {
      items.push({ title, link, description, pubDate, image });
    }
  }
  
  return items;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting sports news sync from 250+ RSS feeds...');

    // STEP 1: Delete old articles (older than 2 days)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const { data: deletedArticles, error: deleteError } = await supabaseAdmin
      .from('news_articles')
      .delete()
      .lt('published_at', twoDaysAgo.toISOString());
    
    if (deleteError) {
      console.error('Error deleting old articles:', deleteError);
    } else {
      console.log(`Deleted articles older than 2 days`);
    }

    // STEP 2: Sync new articles
    let totalArticles = 0;
    let successfulFeeds = 0;
    let failedFeeds = 0;

    for (const feed of RSS_FEEDS) {
      try {
        console.log(`Fetching from ${feed.source} - ${feed.category}...`);
        
        const response = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SportsPulse/1.0)',
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          console.error(`Failed to fetch ${feed.source}: ${response.status}`);
          failedFeeds++;
          continue;
        }

        const xmlText = await response.text();
        const items = parseXMLItems(xmlText);
        
        if (items.length === 0) {
          console.log(`No items found from ${feed.source}`);
          continue;
        }
        
        console.log(`Found ${items.length} articles from ${feed.source}`);

        // Process top 3 articles from each feed
        for (let i = 0; i < Math.min(items.length, 3); i++) {
          const item = items[i];
          
          // Fallback image based on category
          let imageUrl = item.image;
          if (!imageUrl) {
            const fallbackImages: Record<string, string> = {
              'Football': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop',
              'Basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=500&fit=crop',
              'Tennis': 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=500&fit=crop',
              'Baseball': 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=500&fit=crop',
              'General': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=500&fit=crop',
            };
            imageUrl = fallbackImages[feed.category] || fallbackImages['General'];
          }

          // Create unique ID from link
          const articleId = `news-${item.link.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50) || Date.now()}-${Math.random().toString(36).substring(7)}`;

          // Clean description (remove HTML tags)
          const cleanDescription = item.description.replace(/<[^>]*>/g, '').trim();
          const excerpt = cleanDescription.length > 200 
            ? cleanDescription.substring(0, 200) + '...' 
            : cleanDescription;

          // Parse published date
          let publishedAt = new Date().toISOString();
          if (item.pubDate) {
            try {
              publishedAt = new Date(item.pubDate).toISOString();
            } catch {
              // Use current date if parsing fails
            }
          }

          await supabaseAdmin.from('news_articles').upsert({
            id: articleId,
            title: item.title,
            excerpt: excerpt,
            content: cleanDescription,
            image: imageUrl,
            category: feed.category,
            published_at: publishedAt,
          }, { onConflict: 'id' });

          totalArticles++;
        }
        
        successfulFeeds++;
      } catch (error: any) {
        console.error(`Error processing feed ${feed.source}:`, error.message);
        failedFeeds++;
        continue;
      }
    }

    console.log(`Sports news sync completed.`);
    console.log(`Total articles synced: ${totalArticles}`);
    console.log(`Successful feeds: ${successfulFeeds}/${RSS_FEEDS.length}`);
    console.log(`Failed feeds: ${failedFeeds}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sports news synced successfully',
        stats: {
          totalArticles,
          totalFeeds: RSS_FEEDS.length,
          successfulFeeds,
          failedFeeds,
          oldArticlesDeleted: true,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error syncing sports news:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
