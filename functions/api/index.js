// Cloudflare Worker API for DROIT application
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Add CORS headers to allow the Pages site to access this API
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  });
  
  // Handle OPTIONS requests for CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  // Simple health check endpoint
  if (path === '/api' || path === '/api/') {
    return new Response(JSON.stringify({ 
      status: 'online',
      message: 'DROIT API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }), { headers });
  }
  
  // Example news API endpoint
  if (path === '/api/news') {
    if (request.method === 'GET') {
      // Return a mock list of news articles
      const mockNews = [
        {
          id: 1,
          title: {
            fr: "Formation sur les droits fondamentaux",
            ar: "تدريب على الحقوق الأساسية"
          },
          date: {
            fr: "24 juin 2023",
            ar: "24 يونيو 2023"
          },
          author: {
            fr: "Équipe DROIT",
            ar: "فريق الحقوق"
          },
          category: {
            fr: "Formation",
            ar: "تدريب"
          },
          excerpt: {
            fr: "Un nouveau programme de formation sur les droits fondamentaux.",
            ar: "برنامج تدريبي جديد عن الحقوق الأساسية."
          },
          image: "/images/news/formation.jpg",
          slug: "formation-droits-fondamentaux",
          content: "Contenu détaillé sur la formation."
        },
        {
          id: 2,
          title: {
            fr: "Table ronde sur les réformes juridiques",
            ar: "مائدة مستديرة حول الإصلاحات القانونية"
          },
          date: {
            fr: "15 mai 2023",
            ar: "15 مايو 2023"
          },
          author: {
            fr: "Mohamed Hassan",
            ar: "محمد حسن"
          },
          category: {
            fr: "Événements",
            ar: "الأحداث"
          },
          excerpt: {
            fr: "Discussions importantes sur les réformes juridiques récentes.",
            ar: "مناقشات مهمة حول الإصلاحات القانونية الأخيرة."
          },
          image: "/images/news/evenements.jpg",
          slug: "table-ronde-reformes-juridiques",
          content: "Détails de la table ronde."
        }
      ];
      
      return new Response(JSON.stringify(mockNews), { headers });
    }
    
    // Handle POST requests to create a new news item
    if (request.method === 'POST') {
      try {
        const data = await request.json();
        
        // In a real implementation, you would save this to a database
        // For now, just return the received data with a mock ID
        const newItem = {
          id: Date.now(), // Generate a simple ID
          ...data
        };
        
        return new Response(JSON.stringify(newItem), { 
          headers,
          status: 201 // Created
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid JSON data' }), { 
          headers,
          status: 400 // Bad Request
        });
      }
    }
  }
  
  // Return 404 for unknown routes
  return new Response(JSON.stringify({ error: 'Not Found' }), { 
    headers,
    status: 404
  });
}

// Add event listener to handle fetch events
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event.env));
}); 