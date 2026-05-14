(function () {
  if (window.__crazyCartChatWidgetLoaded) return;
  window.__crazyCartChatWidgetLoaded = true;

  const assetBase = "https://uni21corn.github.io/crazy-cart-chat-bot-landing/";
  const widgetRootId = "crazy-cart-chat-landing";
  const tildaFormSelector = window.CRAZY_CART_TILDA_FORM_SELECTOR || ".js-form-proccess";
  const privacyUrl = window.CRAZY_CART_PRIVACY_URL || `${assetBase}privacy.html`;
  const mainSiteUrl =
    "https://franchise.crazy-cart.ru/?utm_source=avito-ads&utm_medium={price_model}&utm_campaign={campaign_id}&utm_term={adgroup_id}&utm_content={ad_id}&rs=avito-ads_{price_model}_{campaign_id}_{adgroup_id}_{ad_id}&roistat_param1={click_id}";
  const avatarImageUrl = `${assetBase}assets/anna-avatar.jpg?v=20260513-3`;
  const cssUrl = `${assetBase}avito-chat.css?v=20260513-4`;

  const introMessages = [
    "Здравствуйте! Меня зовут Анна, я менеджер Crazy Cart.",
    "Помогу понять, какой формат франшизы подойдет под ваш город, бюджет и уровень участия.",
    "Ответьте на 4 коротких вопроса — подготовим презентацию, финмодель и показатели партнеров из похожих городов.",
  ];

  const questions = [
    {
      id: "launch_city",
      text: "В каком городе планируете запуск парка?",
      options: ["Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Другой город"],
    },
    {
      id: "investment",
      text: "Какую сумму готовы инвестировать в открытие?",
      options: ["До 5 млн руб.", "От 5 до 10 млн руб.", "Более 10 млн руб."],
    },
    {
      id: "profit_expectation",
      text: "Какая чистая прибыль на руки в месяц вас устроит?",
      options: ["250 000 - 500 000 руб.", "500 000 - 1 500 000 руб.", "Более 1 500 000 руб."],
    },
    {
      id: "management",
      text: "Как планируете управлять бизнесом?",
      options: [
        "Хочу бизнес «под ключ»: вы даете маркетолога, управляющего и отдел продаж.",
        "Буду во всё вникать и управлять самостоятельно.",
      ],
    },
  ];

  const fieldLabels = {
    launch_city: "Город запуска",
    investment: "Инвестиции",
    profit_expectation: "Желаемая прибыль",
    management: "Управление бизнесом",
  };

  const avatarMarkup = `
    <span class="avatar-fallback">А</span>
    <img src="${avatarImageUrl}" alt="Анна" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()" />
  `;

  const state = {
    questionIndex: -1,
    answers: {},
    leadSent: false,
  };

  function loadStyles() {
    if (!document.querySelector(`link[href="${cssUrl}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssUrl;
      document.head.appendChild(link);
    }

    const fontId = "crazy-cart-chat-font";
    if (!document.getElementById(fontId)) {
      const font = document.createElement("link");
      font.id = fontId;
      font.rel = "stylesheet";
      font.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(font);
    }

    const style = document.createElement("style");
    style.textContent = `
      #${widgetRootId} { min-height: 100vh; }
      #${widgetRootId} .chat-app { min-height: 100vh; }
      .crazy-cart-hidden-tilda-form {
        position: absolute !important;
        left: -99999px !important;
        top: auto !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function root() {
    return document.getElementById(widgetRootId);
  }

  function findTildaForm() {
    return Array.from(document.querySelectorAll(tildaFormSelector)).find((form) => !root()?.contains(form));
  }

  function hideTildaForm() {
    const form = findTildaForm();
    const container = form?.closest("[id^='rec']") || form?.parentElement;
    container?.classList.add("crazy-cart-hidden-tilda-form");
  }

  function setField(form, selectors, name, value) {
    let field = selectors.map((selector) => form.querySelector(selector)).find(Boolean);

    if (!field) {
      field = document.createElement("input");
      field.type = "hidden";
      field.name = name;
      form.appendChild(field);
    }

    field.value = value || "";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    return field;
  }

  function setHiddenField(form, name, value) {
    setField(form, [`[name="${name}"]`], name, value);
  }

  function submitLeadToTilda(payload) {
    const form = findTildaForm();
    if (!form) {
      console.error("Crazy Cart chat: Tilda form not found. Check that the hidden Tilda form block is published.");
      return false;
    }

    setField(form, ['[name="Name"]', '[name="name"]', 'input[type="text"]'], "Name", payload.contact.name);
    setField(form, ['[name="Phone"]', '[name="phone"]', 'input[type="tel"]'], "Phone", payload.contact.phone);
    setHiddenField(form, "Messenger", payload.contact.contactMethod);
    setHiddenField(form, "QuizSource", "Crazy Cart chat landing");
    setHiddenField(form, "Page", window.location.href);
    setHiddenField(form, "SubmittedAt", payload.submittedAt);

    Object.entries(payload.answers).forEach(([key, answer]) => {
      setHiddenField(form, fieldLabels[key] || key, answer.label);
    });

    hideTildaForm();

    const submitButton = form.querySelector('button[type="submit"], input[type="submit"], .t-submit');
    if (submitButton) {
      submitButton.click();
    } else {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }

    return true;
  }

  function injectMarkup() {
    let mount = root();
    if (!mount) {
      mount = document.createElement("div");
      mount.id = widgetRootId;
      document.body.prepend(mount);
    }

    mount.innerHTML = `
      <main class="chat-app" aria-label="Чат с менеджером Crazy Cart">
        <section class="chat-shell" aria-live="polite">
          <div class="loader" id="loader">
            <div class="loader__spinner" aria-hidden="true"></div>
            <p>Подбираем формат франшизы для вашего города...</p>
          </div>

          <div class="chat" id="chat" hidden>
            <header class="chat-header">
              <div class="chat-header__top">
                <div class="operator-avatar">
                  ${avatarMarkup}
                  <i aria-hidden="true"></i>
                </div>
                <div>
                  <p class="operator-name">Анна</p>
                  <p class="operator-status">онлайн</p>
                </div>
              </div>
              <p class="chat-header__note">Crazy Cart — франшиза детских парков</p>
            </header>

            <div class="progress" aria-hidden="true">
              <span id="progressBar"></span>
            </div>

            <div class="messages" id="messages"></div>
            <div class="answer-panel" id="answerPanel"></div>
          </div>
        </section>

        <template id="botMessageTemplate">
          <div class="message message--bot">
            <div class="message__avatar">${avatarMarkup}</div>
            <div class="message__bubble"><p></p></div>
          </div>
        </template>

        <template id="userMessageTemplate">
          <div class="message message--user">
            <div class="message__bubble"><p></p></div>
          </div>
        </template>
      </main>
    `;
  }

  function setupChat() {
    const mount = root();
    const loader = mount.querySelector("#loader");
    const chat = mount.querySelector("#chat");
    const messages = mount.querySelector("#messages");
    const answerPanel = mount.querySelector("#answerPanel");
    const progressBar = mount.querySelector("#progressBar");
    const botTemplate = mount.querySelector("#botMessageTemplate");
    const userTemplate = mount.querySelector("#userMessageTemplate");

    function scrollToBottom() {
      const scroll = () => {
        messages.scrollTop = messages.scrollHeight;
      };
      scroll();
      window.requestAnimationFrame(scroll);
      window.setTimeout(scroll, 80);
    }

    function setProgress() {
      const answered = Math.max(state.questionIndex, 0);
      progressBar.style.width = `${Math.min((answered / questions.length) * 100, 100)}%`;
    }

    function addBotMessage(text) {
      const node = botTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector("p").textContent = text;
      messages.append(node);
      scrollToBottom();
    }

    function addUserMessage(text) {
      const node = userTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector("p").textContent = text;
      messages.append(node);
      scrollToBottom();
    }

    function showTyping() {
      const node = document.createElement("div");
      node.className = "message message--bot typing";
      node.innerHTML = `
        <div class="message__avatar">${avatarMarkup}</div>
        <div class="message__bubble">
          <div class="typing-dots" aria-label="Анна печатает">
            <span></span><span></span><span></span>
          </div>
        </div>
      `;
      messages.append(node);
      scrollToBottom();
      return node;
    }

    async function typeBotMessage(text, delay = 560) {
      const typing = showTyping();
      await wait(delay);
      typing.remove();
      addBotMessage(text);
    }

    function renderOptions(question) {
      answerPanel.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.className = "options";

      question.options.forEach((label, index) => {
        const button = document.createElement("button");
        button.className = "option-button";
        button.type = "button";
        button.textContent = label;
        button.addEventListener("click", () => handleAnswer(question, { id: `${question.id}_${index + 1}`, label }));
        wrapper.append(button);
      });

      answerPanel.append(wrapper);
      scrollToBottom();
    }

    async function askQuestion(index) {
      state.questionIndex = index;
      setProgress();
      answerPanel.innerHTML = "";
      await typeBotMessage(questions[index].text, 520);
      renderOptions(questions[index]);
    }

    async function handleAnswer(question, option) {
      state.answers[question.id] = option;
      answerPanel.innerHTML = "";
      addUserMessage(option.label);

      const nextIndex = state.questionIndex + 1;
      if (nextIndex < questions.length) {
        await wait(240);
        askQuestion(nextIndex);
        return;
      }

      state.questionIndex = questions.length;
      setProgress();
      await typeBotMessage("Спасибо, я вижу основные вводные по вашему запуску.", 620);
      await typeBotMessage("Куда прислать презентацию и финансовую модель?", 620);
      renderContactForm();
    }

    function formatPhone(value) {
      let digits = value.replace(/\D/g, "");
      if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
      if (digits && !digits.startsWith("7")) digits = `7${digits}`;
      digits = digits.slice(0, 11);
      let formatted = "+7";
      if (digits.length > 1) formatted += ` (${digits.slice(1, 4)}`;
      if (digits.length >= 4) formatted += `) ${digits.slice(4, 7)}`;
      if (digits.length >= 7) formatted += `-${digits.slice(7, 9)}`;
      if (digits.length >= 9) formatted += `-${digits.slice(9, 11)}`;
      return formatted;
    }

    function validatePhone(value) {
      return value.replace(/\D/g, "").length >= 11;
    }

    function getLeadPayload(form) {
      const formData = new FormData(form);
      return {
        source: "crazy_cart_franchise_chat_quiz",
        page: window.location.href,
        submittedAt: new Date().toISOString(),
        answers: state.answers,
        contact: {
          name: formData.get("name")?.trim() || "",
          phone: formData.get("phone")?.trim() || "",
          contactMethod: formData.get("contact_method") || "",
        },
      };
    }

    function renderContactForm() {
      answerPanel.innerHTML = `
        <form class="contact-form" id="contactForm" novalidate>
          <label>
            <span>Ваше имя</span>
            <input type="text" name="name" placeholder="Как к вам обращаться" autocomplete="given-name" />
          </label>

          <label>
            <span>Телефон</span>
            <input type="tel" name="phone" placeholder="+7 (___) ___-__-__" autocomplete="tel" inputmode="tel" required />
          </label>
          <p class="field-error" id="phoneError" aria-live="polite"></p>

          <label>
            <span>Куда удобнее получить информацию</span>
            <select name="contact_method" required>
              <option value="Позвонить">Позвонить</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Telegram">Telegram</option>
              <option value="Макс">Макс</option>
            </select>
          </label>

          <label class="consent">
            <input type="checkbox" name="consent" required />
            <span>
              Я соглашаюсь на обработку персональных данных и принимаю
              <a href="${privacyUrl}" target="_blank" rel="noopener noreferrer">политику конфиденциальности</a>.
            </span>
          </label>

          <button class="submit-button" type="submit">Получить презентацию и финмодель</button>
        </form>
      `;

      const form = answerPanel.querySelector("#contactForm");
      const name = form.elements.name;
      const phone = form.elements.phone;
      const phoneError = answerPanel.querySelector("#phoneError");

      scrollToBottom();
      window.setTimeout(() => phone.focus(), 200);

      phone.addEventListener("input", () => {
        phone.value = formatPhone(phone.value);
        phoneError.textContent = "";
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!name.value.trim()) {
          phoneError.textContent = "Введите имя";
          name.focus();
          return;
        }

        if (!validatePhone(phone.value)) {
          phoneError.textContent = "Введите полный номер телефона";
          phone.focus();
          return;
        }

        if (!form.elements.consent.checked) {
          phoneError.textContent = "Поставьте согласие на обработку данных";
          return;
        }

        const button = form.querySelector(".submit-button");
        button.disabled = true;
        button.textContent = "Отправляем...";

        const payload = getLeadPayload(form);
        const sent = submitLeadToTilda(payload);
        sessionStorage.setItem("crazy_cart_quiz_lead", JSON.stringify(payload));

        if (!sent) {
          phoneError.textContent = "Не найдена форма Тильды. Проверьте, что блок формы опубликован.";
          button.disabled = false;
          button.textContent = "Получить презентацию и финмодель";
          return;
        }

        await wait(520);
        state.leadSent = true;
        answerPanel.innerHTML = "";
        addUserMessage(payload.contact.phone);
        await typeBotMessage("Спасибо! Мы свяжемся с вами в ближайшее рабочее время и отправим материалы по франшизе", 760);
        renderSuccessActions();
      });
    }

    function renderSuccessActions() {
      const wrapper = document.createElement("div");
      wrapper.className = "success-actions";
      wrapper.innerHTML = `
        <a href="${mainSiteUrl}" target="_blank" rel="noopener noreferrer">Перейти на сайт Crazy Cart</a>
        <a href="tel:+79039738549">Позвонить: +7 903 973-85-49</a>
      `;
      answerPanel.append(wrapper);
      scrollToBottom();
    }

    async function startChat() {
      hideTildaForm();
      await wait(760);
      loader.hidden = true;
      loader.style.display = "none";
      chat.hidden = false;

      for (const message of introMessages) {
        await typeBotMessage(message, 620);
        await wait(160);
      }

      askQuestion(0);
    }

    startChat();
  }

  function init() {
    loadStyles();
    injectMarkup();
    setupChat();
    window.setTimeout(hideTildaForm, 500);
    window.setTimeout(hideTildaForm, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
