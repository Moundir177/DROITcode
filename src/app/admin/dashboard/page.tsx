'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaHome, FaNewspaper, FaBook, FaUsers, FaCog, FaFileAlt, FaSync, FaDatabase, FaExclamationTriangle } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import { getNews, getResources, getAllPages, initializeDatabase, syncContentToEditor, updateHomePageWithAllSections, updateAboutPageWithAllSections, updateProgramsPageWithAllSections } from '@/lib/database';

export default function AdminDashboard() {
  const router = useRouter();
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [stats, setStats] = useState({
    pages: 0,
    news: 0,
    resources: 0
  });
  const [isResetting, setIsResetting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [recentEdits, setRecentEdits] = useState<{ id: number; page: string; date: string; user: string }[]>([]);

  useEffect(() => {
    setIsClient(true);
    
    // Check if database is initialized
    const dbInit = localStorage.getItem('dbInitialized');
    if (!dbInit) {
      // Initialize database with default values
      initializeDatabase();
      localStorage.setItem('dbInitialized', 'true');
      setIsDbInitialized(true);
    } else {
      setIsDbInitialized(true);
    }
    
    // Redirect if not authenticated
    if (!localStorage.getItem('adminAuth')) {
      router.push('/admin');
    }

    if (isClient) {
      refreshStats();
      
      // Set up recent edits from localStorage
      const storedEdits = localStorage.getItem('recentEdits');
      if (storedEdits) {
        try {
          setRecentEdits(JSON.parse(storedEdits));
        } catch (e) {
          console.error('Error parsing recent edits:', e);
          // Create default recent edits if parsing fails
          createDefaultEdits();
        }
      } else {
        // Create default recent edits if none exist
        createDefaultEdits();
      }
    }
  }, [router, isClient, isAuthenticated]);

  const refreshStats = () => {
    // Get real stats from database
    const news = getNews();
    const resources = getResources();
    const pages = getAllPages();
    
    setStats({
      pages: pages.length,
      news: news.length,
      resources: resources.length
    });
  };
  
  const createDefaultEdits = () => {
    const defaultEdits = [
      { 
        id: 1, 
        page: language === 'fr' ? 'Page d\'accueil' : 'الصفحة الرئيسية', 
        date: new Date().toISOString().split('T')[0], 
        user: 'admin' 
      },
      { 
        id: 2, 
        page: language === 'fr' ? 'Actualités' : 'الأخبار', 
        date: new Date().toISOString().split('T')[0], 
        user: 'admin' 
      },
      { 
        id: 3, 
        page: language === 'fr' ? 'À propos' : 'من نحن', 
        date: new Date().toISOString().split('T')[0], 
        user: 'admin' 
      }
    ];
    
    setRecentEdits(defaultEdits);
    localStorage.setItem('recentEdits', JSON.stringify(defaultEdits));
  };

  const handleSyncContent = () => {
    setIsSyncing(true);
    try {
      // Sync all content to editor
      const success = syncContentToEditor();
      
      if (success) {
        // Refresh all stats
        refreshStats();
        // Show success message or notification
        window.alert(language === 'fr' 
          ? 'Contenu synchronisé avec succès pour l\'édition!' 
          : 'تم مزامنة المحتوى بنجاح للتحرير!');
      } else {
        window.alert(language === 'fr' 
          ? 'Erreur lors de la synchronisation du contenu!' 
          : 'خطأ في مزامنة المحتوى!');
      }
    } catch (error) {
      console.error('Error syncing content', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Only render on client side to avoid hydration issues with authentication
  if (!isClient || !isDbInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaDatabase className="text-gray-400 text-5xl mx-auto animate-pulse mb-4" />
          <p className="text-gray-600">{language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</p>
        </div>
      </div>
    );
  }

  const handleResetContent = () => {
    if (window.confirm(language === 'fr' 
      ? 'Cette action réinitialisera tout le contenu aux valeurs par défaut. Êtes-vous sûr de vouloir continuer?' 
      : 'سيؤدي هذا الإجراء إلى إعادة تعيين كل المحتوى إلى القيم الافتراضية. هل أنت متأكد من أنك تريد المتابعة؟')) {
      setIsResetting(true);
      
      // First clear all content from localStorage (except admin auth)
      const adminAuth = localStorage.getItem('adminAuth');
      const lang = localStorage.getItem('language');
      
      // Clear localStorage entirely
      localStorage.clear();
      
      // Restore admin login and language preference
      if (adminAuth) localStorage.setItem('adminAuth', adminAuth);
      if (lang) localStorage.setItem('language', lang);
      
      // Remove the initialization flag to force reinitialize
      localStorage.removeItem('dbInitialized');
      
      // Initialize the database with default values
      initializeDatabase();
      
      // Initialize all page sections
      updateHomePageWithAllSections();
      updateAboutPageWithAllSections();
      updateProgramsPageWithAllSections();
      
      localStorage.setItem('dbInitialized', 'true');
      
      // Create default recent edits
      createDefaultEdits();
      
      // Refresh statistics
      refreshStats();
      
      setTimeout(() => {
        setIsResetting(false);
        window.location.reload();
      }, 1000);
    }
  };

  const handleForceInitialization = () => {
    setIsResetting(true);
    
    try {
      // Force reinitialization
      localStorage.removeItem('dbInitialized');
      
      // Initialize the database with default values
      initializeDatabase();
      
      // Initialize all page sections
      updateHomePageWithAllSections();
      updateAboutPageWithAllSections();
      updateProgramsPageWithAllSections();
      
      localStorage.setItem('dbInitialized', 'true');
      
      // Create default recent edits
      createDefaultEdits();
      
      // Refresh statistics
      refreshStats();
      
      window.alert(language === 'fr'
        ? 'Base de données réinitialisée avec succès!'
        : 'تمت إعادة تعيين قاعدة البيانات بنجاح!');
    } catch (error) {
      console.error('Error during initialization:', error);
      window.alert('Error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsResetting(false);
    }
  };

  const contentSections = [
    {
      title: language === 'fr' ? 'Pages du Site' : 'صفحات الموقع',
      icon: <FaHome className="w-6 h-6 text-white" />,
      color: 'bg-blue-500',
      link: '/admin/pages',
      count: stats.pages
    },
    {
      title: language === 'fr' ? 'Actualités' : 'الأخبار',
      icon: <FaNewspaper className="w-6 h-6 text-white" />,
      color: 'bg-green-500',
      link: '/admin/news',
      count: stats.news
    },
    {
      title: language === 'fr' ? 'Ressources' : 'الموارد',
      icon: <FaFileAlt className="w-6 h-6 text-white" />,
      color: 'bg-orange-500',
      link: '/admin/resources',
      count: stats.resources
    },
    {
      title: language === 'fr' ? 'Médiathèque' : 'مكتبة الوسائط',
      icon: <FaFileAlt className="w-6 h-6 text-white" />,
      color: 'bg-yellow-500',
      link: '/admin/media-library',
      count: null
    },
    {
      title: language === 'fr' ? 'Contenu Global' : 'المحتوى العام',
      icon: <FaFileAlt className="w-6 h-6 text-white" />,
      color: 'bg-indigo-500',
      link: '/admin/global-content',
      count: null
    },
    {
      title: language === 'fr' ? 'Structure du Site' : 'هيكل الموقع',
      icon: <FaCog className="w-6 h-6 text-white" />,
      color: 'bg-purple-500',
      link: '/admin/structure',
      count: null
    },
    {
      title: language === 'fr' ? 'Paramètres' : 'الإعدادات',
      icon: <FaCog className="w-6 h-6 text-white" />,
      color: 'bg-gray-500',
      link: '/admin/settings',
      count: null
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {language === 'fr' ? 'Tableau de bord' : 'لوحة التحكم'}
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSyncContent}
              disabled={isSyncing}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              {isSyncing ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : (
                <FaSync className="mr-2" />
              )}
              {language === 'fr' ? 'Synchroniser le contenu' : 'مزامنة المحتوى'}
            </button>
            
            <Link href="/admin/pages/edit/home" className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              {language === 'fr' ? 'Voir le site' : 'عرض الموقع'}
            </Link>
          </div>
        </div>
        
        {/* Database Reset Warning Box */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {language === 'fr' ? 'Problèmes avec l\'interface d\'administration?' : 'مشاكل في واجهة الإدارة؟'}
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {language === 'fr' 
                    ? 'Si vous rencontrez des problèmes avec l\'affichage des données dans l\'interface d\'administration, utilisez le bouton ci-dessous pour réinitialiser la base de données locale.'
                    : 'إذا كنت تواجه مشاكل في عرض البيانات في واجهة الإدارة، استخدم الزر أدناه لإعادة تعيين قاعدة البيانات المحلية.'}
                </p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleForceInitialization}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  {isResetting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  ) : (
                    <FaDatabase className="mr-2" />
                  )}
                  {language === 'fr' ? 'Réinitialiser la base de données' : 'إعادة تعيين قاعدة البيانات'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {contentSections.slice(0, 3).map((section, index) => (
            <Link href={section.link} key={index}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-full ${section.color} mr-4`}>
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-700">{section.title}</h2>
                </div>
                {section.count !== null && (
                  <div className="text-4xl font-bold text-gray-800">{section.count}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
        
        {/* Recent Modifications */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {language === 'fr' ? 'Modifications récentes' : 'التعديلات الأخيرة'}
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'fr' ? 'PAGE' : 'الصفحة'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'fr' ? 'DATE' : 'التاريخ'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'fr' ? 'UTILISATEUR' : 'المستخدم'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentEdits.map((edit) => (
                  <tr key={edit.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{edit.page}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{edit.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{edit.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {language === 'fr' ? 'Actions rapides' : 'إجراءات سريعة'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {contentSections.map((section, index) => (
              <Link href={section.link} key={index}>
                <div className="bg-white p-4 rounded-lg shadow flex items-center hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-full ${section.color} mr-3`}>
                    {section.icon}
                  </div>
                  <h3 className="text-sm font-medium text-gray-700">{section.title}</h3>
                </div>
              </Link>
            ))}
            
            {/* Reset Content Button */}
            <button
              onClick={handleResetContent}
              disabled={isResetting}
              className="bg-white p-4 rounded-lg shadow flex items-center hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 rounded-full bg-red-500 mr-3">
                <FaSync className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-medium text-gray-700">
                {isResetting ? (
                  language === 'fr' ? 'Réinitialisation...' : 'جاري إعادة التعيين...'
                ) : (
                  language === 'fr' ? 'Réinitialiser tout' : 'إعادة تعيين الكل'
                )}
              </h3>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 