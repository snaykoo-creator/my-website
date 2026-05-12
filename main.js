(function () {
  "use strict";

  var DEFAULT_AVATAR_SRC = "images/hero-1.jpg";

  var STORAGE_USER = "recipe_demo_user";
  var STORAGE_USERS = "recipe_demo_users";

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ---------- Бургер и шапка (все страницы с header) ---------- */
  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var burger = header.querySelector(".site-header__burger");
    var nav = header.querySelector(".site-header__nav");

    function closeMenu() {
      header.classList.remove("site-header--open");
      if (burger) burger.setAttribute("aria-expanded", "false");
    }

    if (burger && nav) {
      burger.addEventListener("click", function () {
        var open = header.classList.toggle("site-header--open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });

      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          if (window.matchMedia("(max-width: 796px)").matches) closeMenu();
        });
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- Слайдер (главная) ---------- */
  function initSlider() {
    var root = document.querySelector("[data-slider]");
    if (!root) return;

    var slides = $all(".slider__slide", root);
    if (!slides.length) return;

    var idx = 0;

    function show(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, j) {
        s.classList.toggle("slider__slide--active", j === idx);
      });
    }

    var prev = root.querySelector(".slider__btn--prev");
    var next = root.querySelector(".slider__btn--next");
    if (prev) prev.addEventListener("click", function () { show(idx - 1); });
    if (next) next.addEventListener("click", function () { show(idx + 1); });

    setInterval(function () { show(idx + 1); }, 6000);
  }

  /* ---------- Прокрутка: секции на главной ---------- */
  function initReveal() {
    var sections = $all(".section.preview, .section.about, .section.advantages, .section.reviews");
    if (!sections.length || !window.IntersectionObserver) return;

    sections.forEach(function (el) {
      el.classList.add("section--reveal");
    });

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            obs.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    sections.forEach(function (el) { obs.observe(el); });
  }

  /* ---------- Регистрация ---------- */
  function getUsers() {
    try {
      var raw = localStorage.getItem(STORAGE_USERS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(list) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(list));
  }

  function setCurrentUser(user) {
    if (user) localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_USER);
  }

  function getCurrentUser() {
    try {
      var raw = localStorage.getItem(STORAGE_USER);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function showFieldError(inputId, message) {
    var input = document.getElementById(inputId);
    var err = document.querySelector('[data-error-for="' + inputId + '"]');
    if (message) {
      if (err) {
        err.textContent = message;
        err.hidden = false;
      }
      if (input) input.classList.add("form__input--invalid");
    } else {
      if (err) {
        err.textContent = "";
        err.hidden = true;
      }
      if (input) input.classList.remove("form__input--invalid");
    }
  }

  function validateEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function initRegistration() {
    var form = document.getElementById("form-register");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var username = $("#reg-username");
      var email = $("#reg-email");
      var pass = $("#reg-password");
      var pass2 = $("#reg-password2");
      var agree = $("#reg-agree");

      showFieldError("reg-username", "");
      showFieldError("reg-email", "");
      showFieldError("reg-password", "");
      showFieldError("reg-password2", "");
      showFieldError("reg-agree", "");

      var ok = true;

      if (!username.value.trim() || username.value.trim().length < 2) {
        showFieldError("reg-username", "Введите имя (от 2 символов).");
        ok = false;
      }

      if (!validateEmail(email.value.trim())) {
        showFieldError("reg-email", "Укажите корректный e-mail.");
        ok = false;
      }

      if (pass.value.length < 8) {
        showFieldError("reg-password", "Пароль не короче 8 символов.");
        ok = false;
      }

      if (pass.value !== pass2.value) {
        showFieldError("reg-password2", "Пароли не совпадают.");
        ok = false;
      }

      if (!agree.checked) {
        var errAgree = document.querySelector('[data-error-for="reg-agree"]');
        if (errAgree) {
          errAgree.textContent = "Нужно согласие с условиями.";
          errAgree.hidden = false;
        }
        ok = false;
      }

      if (!ok) return;

      var users = getUsers();
      var exists = users.some(function (u) {
        return u.email.toLowerCase() === email.value.trim().toLowerCase();
      });
      if (exists) {
        showFieldError("reg-email", "Этот e-mail уже зарегистрирован.");
        return;
      }

      var user = {
        username: username.value.trim(),
        email: email.value.trim().toLowerCase(),
        password: pass.value,
        fio: "",
        avatarDataUrl: null
      };
      users.push(user);
      saveUsers(users);
      setCurrentUser({
        username: user.username,
        email: user.email,
        fio: user.fio,
        avatarDataUrl: user.avatarDataUrl
      });

      var success = $("#reg-success");
      if (success) success.hidden = false;

      setTimeout(function () {
        window.location.href = "account.html";
      }, 900);
    });
  }

  /* ---------- Вход и кабинет ---------- */
  function initAccount() {
    var loginSection = $("#login-section");
    var panel = $("#cabinet-panel");
    if (!loginSection || !panel) return;

    function render() {
      var u = getCurrentUser();
      if (u) {
        loginSection.hidden = true;
        panel.hidden = false;
        var greet = $("#cabinet-greeting");
        if (greet) greet.textContent = "Здравствуйте, " + (u.username || "гость") + "!";
        var fio = $("#profile-fio");
        var mail = $("#profile-email");
        var av = $("#profile-avatar");
        if (fio) fio.value = u.fio || "";
        if (mail) mail.value = u.email || "";
        if (av && u.avatarDataUrl) av.src = u.avatarDataUrl;
        else if (av && !u.avatarDataUrl) {
          av.src = DEFAULT_AVATAR_SRC;
        }
      } else {
        loginSection.hidden = false;
        panel.hidden = true;
      }
    }

    render();

    if (window.location.hash === "#login") {
      loginSection.scrollIntoView({ behavior: "smooth" });
    }

    var loginForm = $("#form-login");
    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var em = $("#login-email");
        var pw = $("#login-password");
        var glob = $("#login-global-error");
        showFieldError("login-email", "");
        showFieldError("login-password", "");
        if (glob) {
          glob.hidden = true;
          glob.textContent = "";
        }

        var ok = true;
        if (!validateEmail(em.value.trim())) {
          showFieldError("login-email", "Некорректный e-mail.");
          ok = false;
        }
        if (!pw.value) {
          showFieldError("login-password", "Введите пароль.");
          ok = false;
        }
        if (!ok) return;

        var users = getUsers();
        var found = users.find(function (u) {
          return u.email === em.value.trim().toLowerCase() && u.password === pw.value;
        });

        if (!found) {
          if (glob) {
            glob.textContent = "Неверная почта или пароль.";
            glob.hidden = false;
          }
          return;
        }

        setCurrentUser({
          username: found.username,
          email: found.email,
          fio: found.fio || "",
          avatarDataUrl: found.avatarDataUrl || null
        });
        render();
      });
    }

    var profileForm = $("#form-profile");
    if (profileForm) {
      profileForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var u = getCurrentUser();
        if (!u) return;

        var fioVal = ($("#profile-fio") && $("#profile-fio").value) || "";
        u.fio = fioVal.trim();

        var users = getUsers();
        var i = users.findIndex(function (x) { return x.email === u.email; });
        if (i >= 0) {
          users[i].fio = u.fio;
          if (u.avatarDataUrl) users[i].avatarDataUrl = u.avatarDataUrl;
          saveUsers(users);
        }
        setCurrentUser(u);

        var msg = $("#profile-saved");
        if (msg) {
          msg.hidden = false;
          setTimeout(function () { msg.hidden = true; }, 2500);
        }
      });
    }

    var avatarInput = $("#avatar-input");
    if (avatarInput) {
      avatarInput.addEventListener("change", function () {
        var file = avatarInput.files && avatarInput.files[0];
        if (!file || !file.type.startsWith("image/")) return;

        var reader = new FileReader();
        reader.onload = function () {
          var u = getCurrentUser();
          if (!u) return;
          u.avatarDataUrl = reader.result;
          var users = getUsers();
          var i = users.findIndex(function (x) { return x.email === u.email; });
          if (i >= 0) users[i].avatarDataUrl = u.avatarDataUrl;
          saveUsers(users);
          setCurrentUser(u);
          var av = $("#profile-avatar");
          if (av) av.src = u.avatarDataUrl;
        };
        reader.readAsDataURL(file);
      });
    }

    var logout = $("#btn-logout");
    if (logout) {
      logout.addEventListener("click", function () {
        setCurrentUser(null);
        render();
      });
    }
  }

  /* ---------- Каталог рецептов ---------- */
  var RECIPES = [
    {
      id: "1",
      title: "Борщ классический",
      short: "Наваристый суп со свёклой и говядиной — на семью.",
      image: "images/hero-1.jpg",
      category: "soup",
      ingredients: ["Говядина 400 г", "Свёкла 1 шт.", "Капуста 200 г", "Картофель 3 шт.", "Лук, морковь", "Томатная паста 1 ст. л.", "Сметана"],
      steps: ["Сварите бульон из мяса.", "Обжарьте лук с морковью и свёклой, добавьте пасту.", "В бульон положите картофель и капусту, затем зажарку.", "Варите до готовности, дайте настояться.", "Подавайте со сметаной."]
    },
    {
      id: "2",
      title: "Куриная грудка с овощами",
      short: "Быстрый ужин на сковороде без сложных соусов.",
      image: "images/hero-2.jpg",
      category: "main",
      ingredients: ["Куриная грудка 500 г", "Перец болгарский 2 шт.", "Кабачок 1 шт.", "Чеснок 2 зубч.", "Масло, соль, перец"],
      steps: ["Нарежьте филе и овощи.", "Обжарьте курицу до золотистой корочки.", "Добавьте овощи и тушите под крышкой 12–15 минут.", "Посолите, поперчите, подавайте горячим."]
    },
    {
      id: "3",
      title: "Оладьи на кефире",
      short: "Пышные, как у бабушки — на завтрак за 20 минут.",
      image: "images/hero-3.jpg",
      category: "dessert",
      ingredients: ["Кефир 300 мл", "Яйцо 1 шт.", "Мука ~250 г", "Сахар 2 ст. л.", "Сода 0.5 ч. л.", "Соль щепотка"],
      steps: ["Смешайте кефир, яйцо, сахар и соль.", "Погасите соду и влейте в массу.", "Введите муку до густоты сметаны.", "Жарьте на среднем огне с двух сторон."]
    },
    {
      id: "4",
      title: "Грибной крем-суп",
      short: "Нежный суп из шампиньонов со сливками.",
      image: "images/hero-1.jpg",
      category: "soup",
      ingredients: ["Шампиньоны 400 г", "Лук 1 шт.", "Сливки 200 мл", "Бульон 600 мл", "Масло, соль"],
      steps: ["Обжарьте лук и грибы.", "Залейте бульоном, варите 15 минут.", "Пюрируйте блендером.", "Влейте сливки, прогрейте, не кипятите."]
    },
    {
      id: "5",
      title: "Паста карбонара",
      short: "Спагетти с беконом, яйцом и сыром пармезан.",
      image: "images/hero-2.jpg",
      category: "main",
      ingredients: ["Спагетти 400 г", "Бекон 150 г", "Яйца 2 шт.", "Пармезан 80 г", "Чеснок 1 зубч.", "Перец"],
      steps: ["Отварите пасту до al dente.", "Обжарьте бекон с чесноком.", "Смешайте яйца с тёртым сыром.", "Соедините пасту, бекон и соус с огня, перемешайте быстро."]
    },
    {
      id: "6",
      title: "Тирамису (упрощённо)",
      short: "Десерт без выпечки в домашней версии.",
      image: "images/hero-3.jpg",
      category: "dessert",
      ingredients: ["Савоярди 200 г", "Маскарпоне 250 г", "Яйца 2 шт.", "Сахар 60 г", "Кофе эспрессо 200 мл", "Какао"],
      steps: ["Взбейте желтки с сахаром, смешайте с маскарпоне.", "Окуните печенье в кофе и выложите слой.", "Сверху крем, повторите слои.", "Охладите несколько часов, посыпьте какао."]
    },
    {
      id: "7",
      title: "Солянка мясная",
      short: "Сытный суп с колбасами и огурцами.",
      image: "images/hero-1.jpg",
      category: "soup",
      ingredients: ["Говядина, ветчина, колбаса", "Картофель, лук, морковь", "Томаты, огурцы солёные", "Маслины, лимон", "Зелень"],
      steps: ["Сварите бульон, добавьте картофель.", "Обжарьте овощи с колбасами.", "Соедините в кастрюле, добавьте огурцы и томаты.", "Перед подачей — маслины и долька лимона."]
    },
    {
      id: "8",
      title: "Запечённая рыба с лимоном",
      short: "Филе трески или минтая в духовке.",
      image: "images/hero-2.jpg",
      category: "main",
      ingredients: ["Филе рыбы 600 г", "Лимон 0.5 шт.", "Масло оливковое", "Чеснок, укроп", "Соль, перец"],
      steps: ["Смажьте форму маслом, выложите рыбу.", "Сверху лимон, чеснок и зелень.", "Запекайте при 180 °C 18–22 минуты.", "Подавайте с овощным гарниром."]
    }
  ];

  function initRecipes() {
    var grid = $("#recipe-grid");
    if (!grid) return;

    var state = {
      filter: "all",
      search: "",
      visibleCount: 3
    };

    function matches(r) {
      if (state.filter !== "all" && r.category !== state.filter) return false;
      if (state.search && r.title.toLowerCase().indexOf(state.search.toLowerCase()) === -1) return false;
      return true;
    }

    function filtered() {
      return RECIPES.filter(matches);
    }

    function renderList() {
      var list = filtered();
      grid.innerHTML = "";

      var chunk = list.slice(0, state.visibleCount);
      chunk.forEach(function (r) {
        var li = document.createElement("li");
        li.className = "recipe-card";
        li.innerHTML =
          '<img class="recipe-card__img" src="' + r.image + '" alt="" width="800" height="500">' +
          '<div class="recipe-card__body">' +
          '<h2 class="recipe-card__title">' + escapeHtml(r.title) + "</h2>" +
          '<p class="recipe-card__text">' + escapeHtml(r.short) + "</p>" +
          '<button type="button" class="recipe-card__more" data-id="' + r.id + '">Подробнее</button>' +
          "</div>";
        grid.appendChild(li);
      });

      var btnMore = $("#btn-show-more");
      if (btnMore) {
        var hasMore = list.length > state.visibleCount;
        btnMore.hidden = !hasMore;
      }
    }

    function escapeHtml(s) {
      var d = document.createElement("div");
      d.textContent = s;
      return d.innerHTML;
    }

    $all(".filter-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        $all(".filter-chip").forEach(function (c) { c.classList.remove("filter-chip--active"); });
        chip.classList.add("filter-chip--active");
        state.filter = chip.getAttribute("data-filter") || "all";
        state.visibleCount = 3;
        renderList();
      });
    });

    var search = $("#recipe-search");
    if (search) {
      search.addEventListener("input", function () {
        state.search = search.value.trim();
        state.visibleCount = 3;
        renderList();
      });
    }

    var btnMore = $("#btn-show-more");
    if (btnMore) {
      btnMore.addEventListener("click", function () {
        state.visibleCount += 3;
        renderList();
      });
    }

    grid.addEventListener("click", function (e) {
      var t = e.target;
      if (!t.classList.contains("recipe-card__more")) return;
      var id = t.getAttribute("data-id");
      var r = RECIPES.find(function (x) { return x.id === id; });
      if (r) openRecipeModal(r);
    });

    renderList();
    initModal();
  }

  function initModal() {
    var modal = $("#recipe-modal");
    if (!modal) return;

    function close() {
      modal.hidden = true;
      document.body.style.overflow = "";
    }

    $all("[data-modal-close]", modal).forEach(function (el) {
      el.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) close();
    });
  }

  function openRecipeModal(r) {
    var modal = $("#recipe-modal");
    if (!modal) return;

    $("#modal-title").textContent = r.title;
    var img = $("#modal-img");
    img.src = r.image;
    img.alt = r.title;

    var ing = $("#modal-ingredients");
    ing.innerHTML = "";
    r.ingredients.forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = line;
      ing.appendChild(li);
    });

    var steps = $("#modal-steps");
    steps.innerHTML = "";
    r.steps.forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = line;
      steps.appendChild(li);
    });

    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  /* ---------- Старт ---------- */
  function boot() {
    initHeader();
    initSlider();
    initReveal();
    initRegistration();
    initAccount();
    initRecipes();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
