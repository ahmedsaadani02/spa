import type { AppLanguage } from '../services/language.service';

export const SHELL_I18N = {
  fr: {
    appTitle: "SPA - Societe d'Aluminium",
    appSubtitle: 'Facturation | Vente & Fabrication',
    nav: {
      dashboard: 'Tableau de bord',
      tasks: 'Taches',
      invoices: 'Factures',
      quotes: 'Devis',
      clients: 'Clients',
      stock: 'Stock',
      inventory: 'Inventaire',
      employees: 'Salaries',
      archives: 'Archives'
    },
    account: 'Mon compte',
    settings: 'Parametres',
    logout: 'Se deconnecter',
    footer: "SPA - Societe d'Aluminium | Merci pour votre confiance",
    notifications: {
      title: 'Notifications',
      empty: 'Aucune notification recente',
      markRead: 'Marquer comme lue',
      markAllRead: 'Tout marquer comme lu',
      assignedTitle: 'Nouvelle tache assignee',
      assignedMessage: (taskTitle: string, actorName: string) =>
        `${actorName} vous a assigne la tache "${taskTitle}".`
    },
    language: {
      fr: 'FR',
      ar: 'AR'
    }
  },
  ar: {
    appTitle: 'SPA - شركة الألمنيوم',
    appSubtitle: 'الفوترة | البيع والتصنيع',
    nav: {
      dashboard: 'لوحة التحكم',
      tasks: 'المهام',
      invoices: 'الفواتير',
      quotes: 'عروض الأسعار',
      clients: 'العملاء',
      stock: 'المخزون',
      inventory: 'الجرد',
      employees: 'الموظفون',
      archives: 'الأرشيف'
    },
    account: 'حسابي',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    footer: 'SPA - شركة الألمنيوم | شكرا لثقتكم',
    notifications: {
      title: 'الإشعارات',
      empty: 'لا توجد إشعارات حديثة',
      markRead: 'تحديد كمقروءة',
      markAllRead: 'تحديد الكل كمقروء',
      assignedTitle: 'مهمة جديدة',
      assignedMessage: (taskTitle: string, actorName: string) =>
        `${actorName} قام بإسناد المهمة "${taskTitle}" إليك.`
    },
    language: {
      fr: 'FR',
      ar: 'AR'
    }
  }
} as const;

export const DASHBOARD_I18N = {
  fr: {
    title: 'Tableau de bord',
    hello: 'Bonjour',
    greeting: 'retrouvez ici les modules prioritaires autorises pour votre profil.',
    emptyTitle: 'Aucun module disponible',
    emptyText: 'Votre compte ne dispose pas encore d un acces metier pour afficher un tableau de bord complet.',
    open: 'Ouvrir',
    roleOwner: 'Owner',
    roleAdmin: 'Administration',
    roleDeveloper: 'Direction technique',
    roleEmployee: 'Espace de travail',
    links: {
      tasks: 'Taches',
      tasksMine: 'Retrouver vos taches assignees et votre avancement.',
      tasksAdmin: 'Suivre les priorites et les affectations en cours.',
      invoices: 'Factures',
      invoicesDesc: 'Piloter les documents de vente et les encaissements.',
      quotes: 'Devis',
      quotesDesc: 'Preparer les propositions commerciales et les conversions.',
      clients: 'Clients',
      clientsDesc: 'Consulter et enrichir la base clients.',
      stock: 'Stock',
      stockDesc: 'Regrouper les produits, les disponibilites et les ajustements de stock.',
      inventory: 'Inventaire',
      inventoryDesc: 'Verifier les ecarts et retrouver les mouvements depuis un meme espace.',
      employees: 'Salaries',
      employeesDesc: 'Centraliser les profils, acces et informations de remuneration.',
      archives: 'Archives',
      archivesDesc: 'Retrouver les articles et donnees archivees.'
    }
  },
  ar: {
    title: 'لوحة التحكم',
    hello: 'مرحبا',
    greeting: 'هنا تجد الوحدات الأساسية المسموح بها حسب صلاحياتك.',
    emptyTitle: 'لا توجد وحدات متاحة',
    emptyText: 'لا يملك حسابك حاليا صلاحيات مهنية كافية لعرض لوحة تحكم كاملة.',
    open: 'فتح',
    roleOwner: 'المالك',
    roleAdmin: 'الإدارة',
    roleDeveloper: 'الإدارة التقنية',
    roleEmployee: 'مساحة العمل',
    links: {
      tasks: 'المهام',
      tasksMine: 'تابع مهامك المسندة وتقدمك الحالي.',
      tasksAdmin: 'تابع الأولويات والإسنادات الجارية.',
      invoices: 'الفواتير',
      invoicesDesc: 'إدارة وثائق البيع والتحصيل.',
      quotes: 'عروض الأسعار',
      quotesDesc: 'إعداد العروض التجارية والتحويلات.',
      clients: 'العملاء',
      clientsDesc: 'استعراض قاعدة العملاء وتطويرها.',
      stock: 'المخزون',
      stockDesc: 'تجميع المنتجات والتوفر وتعديلات المخزون.',
      inventory: 'الجرد',
      inventoryDesc: 'مراجعة الفروقات والرجوع إلى الحركات من نفس المساحة.',
      employees: 'الموظفون',
      employeesDesc: 'تجميع الملفات والصلاحيات وبيانات الأجور.',
      archives: 'الأرشيف',
      archivesDesc: 'استعراض العناصر والبيانات المؤرشفة.'
    }
  }
} as const;

export const TASKS_I18N = {
  fr: {
    admin: {
      title: 'Taches',
      subtitle: 'Suivi simple des taches assignees aux employes.',
      newTask: 'Nouvelle tache',
      quickView: 'Vue rapide des taches',
      quickPilot: 'Pilotage des taches',
      loadingStrong: 'Chargement des taches',
      loadingText: 'Le module prepare votre vue prioritaire.',
      loadingListText: 'Les donnees s affichent des qu elles sont disponibles.',
      employee: 'Employe',
      allEmployees: 'Tous les employes',
      status: 'Statut',
      priority: 'Priorite',
      task: 'Tache',
      dueDate: 'Echeance',
      progress: 'Progression',
      actions: 'Actions',
      noTask: 'Aucune tache.',
      unassigned: 'Non assignee',
      employeeNote: 'Note employe',
      updatedByEmployee: 'Maj employe',
      createdAt: 'Creation',
      createdBy: 'Cree par',
      deleteTitle: 'Confirmer la suppression',
      deleteText: 'Voulez-vous vraiment supprimer cette tache ?',
      cancel: 'Annuler',
      delete: 'Supprimer',
      deleting: 'Suppression...',
      edit: 'Modifier',
      metrics: {
        total: 'Total',
        active: 'En cours',
        done: 'Terminees',
        overdue: 'En retard'
      }
    },
    mine: {
      title: 'Mes taches',
      subtitle: 'Suivez vos taches assignees et mettez a jour votre avancement.',
      loadingStrong: 'Chargement de mes taches',
      loadingText: 'Votre espace se met a jour immediatement apres la navigation.',
      noTask: 'Aucune tache assignee.',
      dueDate: 'Echeance',
      note: 'Note',
      updatedAt: 'Derniere mise a jour',
      createdAt: 'Creation',
      createdBy: 'Cree par',
      update: 'Mettre a jour',
      updateTitle: 'Mettre a jour la tache',
      progress: 'Progression (%)',
      employeeNote: 'Note d avancement',
      save: 'Enregistrer',
      saving: 'Enregistrement...'
    },
    form: {
      newTitle: 'Nouvelle tache',
      editTitle: 'Modifier tache',
      subtitle: 'Creation et suivi des taches d equipe.',
      back: 'Retour',
      openingStrong: 'Ouverture du formulaire',
      openingText: 'Les informations de la tache et des employes sont en cours de chargement.',
      titleFr: 'Titre (FR)',
      titleAr: 'Titre (AR)',
      descriptionFr: 'Description (FR)',
      descriptionAr: 'Description (AR)',
      employee: 'Employe',
      unassigned: 'Non assignee',
      status: 'Statut',
      priority: 'Priorite',
      dueDate: 'Echeance',
      progress: 'Progression (%)',
      createdAt: 'Cree le',
      createdBy: 'Cree par',
      cancel: 'Annuler',
      save: 'Enregistrer',
      saving: 'Enregistrement...'
    },
    status: {
      all: 'Tous les statuts',
      todo: 'A faire',
      in_progress: 'En cours',
      done: 'Terminee',
      blocked: 'Bloquee'
    },
    priority: {
      all: 'Toutes les priorites',
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute'
    },
    misc: {
      noDueDate: 'Sans echeance',
      unknownAuthor: 'Systeme'
    }
  },
  ar: {
    admin: {
      title: 'المهام',
      subtitle: 'متابعة مبسطة للمهام المسندة إلى الموظفين.',
      newTask: 'مهمة جديدة',
      quickView: 'نظرة سريعة على المهام',
      quickPilot: 'متابعة المهام',
      loadingStrong: 'جاري تحميل المهام',
      loadingText: 'يتم الآن تجهيز العرض الأساسي الخاص بك.',
      loadingListText: 'ستظهر البيانات فور توفرها.',
      employee: 'الموظف',
      allEmployees: 'كل الموظفين',
      status: 'الحالة',
      priority: 'الأولوية',
      task: 'المهمة',
      dueDate: 'الأجل',
      progress: 'نسبة التقدم',
      actions: 'الإجراءات',
      noTask: 'لا توجد مهام.',
      unassigned: 'غير مسندة',
      employeeNote: 'ملاحظة الموظف',
      updatedByEmployee: 'آخر تحديث من الموظف',
      createdAt: 'الإنشاء',
      createdBy: 'أنشأها',
      deleteTitle: 'تأكيد الحذف',
      deleteText: 'هل تريد فعلا حذف هذه المهمة؟',
      cancel: 'إلغاء',
      delete: 'حذف',
      deleting: 'جار الحذف...',
      edit: 'تعديل',
      metrics: {
        total: 'الإجمالي',
        active: 'قيد التنفيذ',
        done: 'مكتملة',
        overdue: 'متأخرة'
      }
    },
    mine: {
      title: 'مهامي',
      subtitle: 'تابع مهامك المسندة وحدث نسبة تقدمك.',
      loadingStrong: 'جاري تحميل مهامي',
      loadingText: 'يتم تحديث مساحتك مباشرة بعد التنقل.',
      noTask: 'لا توجد مهام مسندة.',
      dueDate: 'الأجل',
      note: 'ملاحظة',
      updatedAt: 'آخر تحديث',
      createdAt: 'أنشئت في',
      createdBy: 'أنشأها',
      update: 'تحديث',
      updateTitle: 'تحديث المهمة',
      progress: 'نسبة التقدم (%)',
      employeeNote: 'ملاحظة التقدم',
      save: 'حفظ',
      saving: 'جار الحفظ...'
    },
    form: {
      newTitle: 'مهمة جديدة',
      editTitle: 'تعديل المهمة',
      subtitle: 'إنشاء ومتابعة مهام الفريق.',
      back: 'رجوع',
      openingStrong: 'جاري فتح النموذج',
      openingText: 'يتم الآن تحميل بيانات المهمة والموظفين.',
      titleFr: 'العنوان (فرنسي)',
      titleAr: 'العنوان (عربي)',
      descriptionFr: 'الوصف (فرنسي)',
      descriptionAr: 'الوصف (عربي)',
      employee: 'الموظف',
      unassigned: 'غير مسندة',
      status: 'الحالة',
      priority: 'الأولوية',
      dueDate: 'الأجل',
      progress: 'نسبة التقدم (%)',
      createdAt: 'تاريخ الإنشاء',
      createdBy: 'أنشأها',
      cancel: 'إلغاء',
      save: 'حفظ',
      saving: 'جار الحفظ...'
    },
    status: {
      all: 'كل الحالات',
      todo: 'للإنجاز',
      in_progress: 'قيد التنفيذ',
      done: 'مكتملة',
      blocked: 'معطلة'
    },
    priority: {
      all: 'كل الأولويات',
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية'
    },
    misc: {
      noDueDate: 'بدون أجل',
      unknownAuthor: 'النظام'
    }
  }
} as const satisfies Record<AppLanguage, unknown>;
