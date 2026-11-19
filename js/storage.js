window.CB_STORAGE = (() => {
  const ACCOUNTS_KEY = 'comer_bien_accounts_v2';
  const SESSION_KEY = 'comer_bien_active_user_v2';

  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return 'h_' + Math.abs(h);
  }

  function userDataKey(username) {
    return `comer_bien_data_${username.toLowerCase()}_v2`;
  }

  function formatIso(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getTodayIso() {
    return formatIso(new Date());
  }

  function getPlanningContext(now = new Date()) {
    const mins = now.getHours() * 60 + now.getMinutes();
    const todayDow = now.getDay();
    const todayIdx = todayDow === 0 ? 6 : todayDow - 1;

    if (now.getHours() >= 22) {
      const tom = new Date(now);
      tom.setDate(tom.getDate() + 1);
      return {
        isTomorrow: true,
        dayWord: 'mañana',
        targetDateIso: formatIso(tom),
        targetDayIndex: (todayIdx + 1) % 7,
        disabledMoments: [],
      };
    }

    const disabledMoments = [];
    if (mins >= 10 * 60) disabledMoments.push('desayuno');
    if (mins >= 14 * 60 + 30) disabledMoments.push('almuerzo');
    if (mins >= 18 * 60 + 30) disabledMoments.push('merienda');

    return {
      isTomorrow: false,
      dayWord: 'hoy',
      targetDateIso: formatIso(now),
      targetDayIndex: todayIdx,
      disabledMoments,
    };
  }

  function ensureSeeded() {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // regenerar si está corrupto
      }
    }

    const sofiaProfile = {
      username: 'sofia',
      fullName: 'Sofía Rodríguez',
      email: 'sofia@comerbien.uy',
      householdSize: 2,
      weeklyBudgetUyu: 4200,
      preferences: ['Platos de olla económicos', 'Muchos vegetales de estación', 'Legumbres frecuentes'],
      restrictions: [],
      habits: {
        waterGlassesGoal: 8,
        cookingTimePreference: 'moderado',
        notes: 'Busco organizar la semana para no improvisar.',
      },
    };

    const mateoProfile = {
      username: 'mateo',
      fullName: 'Mateo Silva',
      email: 'mateo@comerbien.uy',
      householdSize: 1,
      weeklyBudgetUyu: 2800,
      preferences: ['Comidas rápidas (< 25 min)', 'Viandas para llevar'],
      restrictions: ['Sin lactosa'],
      habits: {
        waterGlassesGoal: 8,
        cookingTimePreference: 'rapido',
        notes: 'Trabajo todo el día afuera, necesito recetas prácticas.',
      },
    };

    const accounts = {
      sofia: { passwordHash: simpleHash('comer1234'), profile: sofiaProfile },
      mateo: { passwordHash: simpleHash('comer1234'), profile: mateoProfile },
    };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

    const today = getTodayIso();
    const sofiaData = {
      favorites: ['almuerzo-guiso-lentejas', 'desayuno-avena-manzana', 'cena-tortilla-papa-espinaca'],
      menuSlots: window.CB_ENGINE ? window.CB_ENGINE.generateWeeklyMenu(sofiaProfile) : [],
      dailyLogs: [
        {
          id: 'log-s1',
          logDate: today,
          moment: 'desayuno',
          recipeId: 'desayuno-avena-manzana',
          title: 'Avena tibia con manzana rallada y canela',
          status: 'eaten',
          foodGroups: ['cereales_tuberculos', 'frutas', 'lacteos'],
        },
        {
          id: 'log-s2',
          logDate: today,
          moment: 'almuerzo',
          recipeId: 'almuerzo-guiso-lentejas',
          title: 'Guiso uruguayo de lentejas, zapallo y arroz',
          status: 'planned',
          foodGroups: ['legumbres', 'verduras', 'cereales_tuberculos'],
        },
      ],
      shoppingList: [
        { id: 'sh-1', name: 'Lentejas secas', quantity: 500, unit: 'g', category: 'Almacén y Legumbres', estimatedUyu: 95, checked: false, fromMenu: true },
        { id: 'sh-2', name: 'Zapallo cabutiá', quantity: 1, unit: 'kg', category: 'Verdulería y Frutería', estimatedUyu: 85, checked: false, fromMenu: true },
        { id: 'sh-3', name: 'Naranjas de estación', quantity: 1.5, unit: 'kg', category: 'Verdulería y Frutería', estimatedUyu: 110, checked: true, fromMenu: true },
      ],
    };
    localStorage.setItem(userDataKey('sofia'), JSON.stringify(sofiaData));

    const mateoData = {
      favorites: ['cena-faina-garbanzos-ensalada', 'almuerzo-fideos-fileto-atun'],
      menuSlots: window.CB_ENGINE ? window.CB_ENGINE.generateWeeklyMenu(mateoProfile) : [],
      dailyLogs: [
        {
          id: 'log-m1',
          logDate: today,
          moment: 'desayuno',
          recipeId: 'desayuno-tostadas-palta-huevo',
          title: 'Tostadas integrales con huevo revuelto, tomate y palta',
          status: 'eaten',
          foodGroups: ['cereales_tuberculos', 'proteinas_animales', 'verduras', 'grasas_saludables'],
        },
      ],
      shoppingList: [],
    };
    localStorage.setItem(userDataKey('mateo'), JSON.stringify(mateoData));

    return accounts;
  }

  function getActiveUser() {
    const accounts = ensureSeeded();
    const uname = localStorage.getItem(SESSION_KEY);
    if (!uname || !accounts[uname]) return null;
    return accounts[uname].profile;
  }

  function login(username, password) {
    const clean = (username || '').trim().toLowerCase();
    const accounts = ensureSeeded();
    const acc = accounts[clean];
    if (!acc || acc.passwordHash !== simpleHash(password || '')) {
      throw new Error('Usuario o contraseña incorrectos. Probá con "sofia" / "comer1234".');
    }
    localStorage.setItem(SESSION_KEY, clean);
    return acc.profile;
  }

  function register({ username, fullName, email, password }) {
    const clean = (username || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (clean.length < 3) throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
    if (!email || !email.includes('@')) throw new Error('Ingresá un correo electrónico válido.');
    if (!password || password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');

    const accounts = ensureSeeded();
    if (accounts[clean]) throw new Error('Ese nombre de usuario ya existe. Elegí otro.');

    const profile = {
      username: clean,
      fullName: (fullName || clean).trim(),
      email: email.trim().toLowerCase(),
      householdSize: 1,
      weeklyBudgetUyu: 3500,
      preferences: [],
      restrictions: [],
      habits: { waterGlassesGoal: 8, cookingTimePreference: 'moderado', notes: '' },
    };

    accounts[clean] = { passwordHash: simpleHash(password), profile };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    localStorage.setItem(
      userDataKey(clean),
      JSON.stringify({ favorites: [], menuSlots: [], dailyLogs: [], shoppingList: [] })
    );
    localStorage.setItem(SESSION_KEY, clean);
    return profile;
  }

  function recoverPassword(username, email, newPassword) {
    const clean = (username || '').trim().toLowerCase();
    const accounts = ensureSeeded();
    const acc = accounts[clean];
    if (!acc || acc.profile.email.toLowerCase() !== (email || '').trim().toLowerCase()) {
      throw new Error('No coincide el usuario con el correo registrado.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    acc.passwordHash = simpleHash(newPassword);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function saveProfile(profile) {
    const accounts = ensureSeeded();
    if (accounts[profile.username]) {
      accounts[profile.username].profile = profile;
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }
  }

  function getUserData(username) {
    const raw = localStorage.getItem(userDataKey(username));
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    const empty = { favorites: [], menuSlots: [], dailyLogs: [], shoppingList: [] };
    localStorage.setItem(userDataKey(username), JSON.stringify(empty));
    return empty;
  }

  function saveUserData(username, data) {
    localStorage.setItem(userDataKey(username), JSON.stringify(data));
  }

  return {
    getTodayIso,
    getPlanningContext,
    getActiveUser,
    login,
    register,
    recoverPassword,
    logout,
    saveProfile,
    getUserData,
    saveUserData,
  };
})();
