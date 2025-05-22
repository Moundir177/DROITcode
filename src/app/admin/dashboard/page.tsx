'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaHome, FaNewspaper, FaBook, FaUsers, FaCog, FaFileAlt, FaSync, FaDatabase } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import ApiStatus from '@/components/ApiStatus';
import { getNews, getResources, getAllPages, initializeDatabase, syncContentToEditor } from '@/lib/database';

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
                <FaSync className="w-4 h-4 mr-2" />
              )}
              {language === 'fr' ? 'Synchroniser' : 'مزامنة'}
            </button>
            <button
              onClick={handleResetContent}
              disabled={isResetting}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              {isResetting ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : (
                <FaDatabase className="w-4 h-4 mr-2" />
              )}
              {language === 'fr' ? 'Réinitialiser' : 'إعادة تعيين'}
            </button>
          </div>
        </div>
        
        {/* API Status Component */}
        <ApiStatus />
        
        {/* Content Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {contentSections.map((section, index) => (
            <Link 
              href={section.link}
              key={index} 
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="flex items-center p-6">
                <div className={`${section.color} p-3 rounded-full mr-4`}>
                  {section.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{section.title}</h3>
                  {section.count !== null && (
                    <p className="text-gray-600 mt-1">
                      {section.count} {language === 'fr' ? 'éléments' : 'عناصر'}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Recent Edits */}
        <div className="bg-white rounded-md shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {language === 'fr' ? 'Modifications récentes' : 'التعديلات الأخيرة'}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'fr' ? 'Page' : 'الصفحة'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'fr' ? 'Date' : 'التاريخ'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'fr' ? 'Utilisateur' : 'المستخدم'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentEdits.map((edit) => (
                  <tr key={edit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {edit.page}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {edit.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {edit.user}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <FaNewspaper className="text-blue-500 text-2xl" />
            </div>
            <div>
              <p className="text-gray-500">{language === 'fr' ? 'Actualités' : 'الأخبار'}</p>
              <h2 className="text-2xl font-bold">{stats.news}</h2>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <FaBook className="text-green-500 text-2xl" />
            </div>
            <div>
              <p className="text-gray-500">{language === 'fr' ? 'Ressources' : 'الموارد'}</p>
              <h2 className="text-2xl font-bold">{stats.resources}</h2>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center">
            <div className="bg-orange-100 p-3 rounded-full mr-4">
              <FaFileAlt className="text-orange-500 text-2xl" />
            </div>
            <div>
              <p className="text-gray-500">{language === 'fr' ? 'Pages' : 'الصفحات'}</p>
              <h2 className="text-2xl font-bold">{stats.pages}</h2>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <h2 className="text-2xl font-bold mb-6">
          {language === 'fr' ? 'Actions rapides' : 'إجراءات سريعة'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/admin/news/create" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <FaNewspaper className="text-blue-500 text-2xl mb-4" />
            <h3 className="font-bold text-lg mb-2">
              {language === 'fr' ? 'Ajouter actualité' : 'إضافة خبر'}
            </h3>
            <p className="text-gray-500 text-sm">
              {language === 'fr' ? 'Créer une nouvelle actualité' : 'إنشاء خبر جديد'}
            </p>
          </Link>
          
          <Link href="/admin/resources/create" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <FaBook className="text-green-500 text-2xl mb-4" />
            <h3 className="font-bold text-lg mb-2">
              {language === 'fr' ? 'Ajouter ressource' : 'إضافة مورد'}
            </h3>
            <p className="text-gray-500 text-sm">
              {language === 'fr' ? 'Ajouter une nouvelle ressource' : 'إضافة مورد جديد'}
            </p>
          </Link>
          
          <Link href="/admin/pages" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <FaFileAlt className="text-orange-500 text-2xl mb-4" />
            <h3 className="font-bold text-lg mb-2">
              {language === 'fr' ? 'Éditer pages' : 'تحرير الصفحات'}
            </h3>
            <p className="text-gray-500 text-sm">
              {language === 'fr' ? 'Modifier le contenu des pages' : 'تعديل محتوى الصفحات'}
            </p>
          </Link>
          
          <button 
            onClick={refreshStats}
            className="text-left bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <FaSync className="text-gray-500 text-2xl mb-4" />
            <h3 className="font-bold text-lg mb-2">
              {language === 'fr' ? 'Actualiser les stats' : 'تحديث الإحصاءات'}
            </h3>
            <p className="text-gray-500 text-sm">
              {language === 'fr' ? 'Mettre à jour les statistiques' : 'تحديث الإحصائيات'}
            </p>
          </button>
        </div>
        
        {/* Admin Tools */}
        <h2 className="text-2xl font-bold mb-6">
          {language === 'fr' ? 'Outils administrateur' : 'أدوات المسؤول'}
        </h2>
        
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <h3 className="font-bold text-lg mb-4 flex items-center">
            <FaSync className="text-red-500 mr-2" />
            {language === 'fr' ? 'Réinitialiser le contenu' : 'إعادة تعيين المحتوى'}
          </h3>
          <p className="text-gray-500 mb-4">
            {language === 'fr' 
              ? 'Cette action réinitialisera tout le contenu aux valeurs par défaut actuelles. Utilisez avec précaution!' 
              : 'سيؤدي هذا الإجراء إلى إعادة تعيين كل المحتوى إلى القيم الافتراضية الحالية. استخدم بحذر!'}
          </p>
          <button 
            onClick={handleResetContent}
            disabled={isResetting}
            className={`px-4 py-2 rounded-lg text-white font-medium flex items-center ${
              isResetting ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isResetting && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {language === 'fr' 
              ? isResetting ? 'Réinitialisation...' : 'Réinitialiser le contenu' 
              : isResetting ? 'جاري إعادة التعيين...' : 'إعادة تعيين المحتوى'}
          </button>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 text-sm text-gray-600">
          <p>
            {language === 'fr' 
              ? 'Rappel : Ce système de gestion de contenu utilise le stockage local du navigateur. Dans un environnement de production, les données seraient stockées sur un serveur.' 
              : 'تذكير: يستخدم نظام إدارة المحتوى هذا التخزين المحلي للمتصفح. في بيئة الإنتاج، سيتم تخزين البيانات على خادم.'}
          </p>
        </div>
      </main>
    </div>
  );
} 