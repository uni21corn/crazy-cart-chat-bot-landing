const introMessages = [
  "Здравствуйте! Меня зовут Анна, я менеджер Crazy Cart.",
  "Помогу понять, какой формат франшизы подойдет под ваш город, бюджет и уровень участия.",
  "Ответьте на 4 коротких вопроса — подготовим презентацию, финмодель и показатели партнеров из похожих городов.",
];

const questions = [
  {
    id: "launch_city",
    text: "В каком городе планируете запуск парка?",
    options: [
      { id: "moscow", label: "Москва" },
      { id: "spb", label: "Санкт-Петербург" },
      { id: "kazan", label: "Казань" },
      { id: "ekaterinburg", label: "Екатеринбург" },
      { id: "other", label: "Другой город" },
    ],
  },
  {
    id: "investment",
    text: "Какую сумму готовы инвестировать в открытие?",
    options: [
      { id: "under_5", label: "До 5 млн руб." },
      { id: "5_10", label: "От 5 до 10 млн руб." },
      { id: "over_10", label: "Более 10 млн руб." },
    ],
  },
  {
    id: "profit_expectation",
    text: "Какая чистая прибыль на руки в месяц вас устроит?",
    options: [
      { id: "250_500", label: "250 000 - 500 000 руб." },
      { id: "500_1500", label: "500 000 - 1 500 000 руб." },
      { id: "over_1500", label: "Более 1 500 000 руб." },
    ],
  },
  {
    id: "management",
    text: "Как планируете управлять бизнесом?",
    options: [
      {
        id: "turnkey",
        label: "Хочу бизнес «под ключ»: вы даете маркетолога, управляющего и отдел продаж.",
      },
      { id: "active", label: "Буду во всё вникать и управлять самостоятельно." },
    ],
  },
];

const loader = document.querySelector("#loader");
const chat = document.querySelector("#chat");
const messages = document.querySelector("#messages");
const answerPanel = document.querySelector("#answerPanel");
const progressBar = document.querySelector("#progressBar");
const botTemplate = document.querySelector("#botMessageTemplate");
const userTemplate = document.querySelector("#userMessageTemplate");
const pagePath = window.location.pathname.replace(/\/+$/, "");
const linkPrefix = pagePath.endsWith("/avito") ? ".." : ".";
const mainSiteUrl = "https://franchise.crazy-cart.ru/";
const avatarImageUrl = "./assets/anna-avatar.jpg?v=20260513-3";
const avatarMarkup = `
  <span class="avatar-fallback">А</span>
  <img src="${avatarImageUrl}" alt="Анна" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()" />
`;

const state = {
  questionIndex: -1,
  answers: {},
  leadSent: false,
};

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

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
  const percent = Math.min((answered / questions.length) * 100, 100);
  progressBar.style.width = `${percent}%`;
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
      <div class="typing-dots" aria-label="Юрист печатает">
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

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option-button";
    button.type = "button";
    button.textContent = option.label;
    button.addEventListener("click", () => handleAnswer(question, option));
    wrapper.append(button);
  });

  answerPanel.append(wrapper);
  scrollToBottom();
}

async function askQuestion(index) {
  state.questionIndex = index;
  setProgress();
  answerPanel.innerHTML = "";

  const question = questions[index];
  await typeBotMessage(question.text, 520);
  renderOptions(question);
}

async function handleAnswer(question, option) {
  state.answers[question.id] = {
    id: option.id,
    label: option.label,
  };

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

  if (digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }

  if (digits && !digits.startsWith("7")) {
    digits = `7${digits}`;
  }

  digits = digits.slice(0, 11);

  let formatted = "+7";

  if (digits.length > 1) {
    formatted += ` (${digits.slice(1, 4)}`;
  }

  if (digits.length >= 4) {
    formatted += `) ${digits.slice(4, 7)}`;
  }

  if (digits.length >= 7) {
    formatted += `-${digits.slice(7, 9)}`;
  }

  if (digits.length >= 9) {
    formatted += `-${digits.slice(9, 11)}`;
  }

  return formatted;
}

function validatePhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 11;
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
          <option value="phone">Позвонить</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="telegram">Telegram</option>
          <option value="max">Макс</option>
        </select>
      </label>

      <label class="consent">
        <input type="checkbox" name="consent" required />
        <span>
          Я соглашаюсь на обработку персональных данных и принимаю
          <a href="${linkPrefix}/privacy.html" target="_blank" rel="noopener noreferrer">политику конфиденциальности</a>.
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
    sessionStorage.setItem("crazy_cart_quiz_lead", JSON.stringify(payload));

    await wait(520);
    state.leadSent = true;
    answerPanel.innerHTML = "";
    addUserMessage(payload.contact.phone);
    await typeBotMessage(
      "Спасибо! Анна свяжется с вами в ближайшее рабочее время и отправит материалы по франшизе.",
      760,
    );
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
