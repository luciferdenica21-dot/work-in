import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ru: {
    translation: {
      "ГЛАВНАЯ": "ГЛАВНАЯ",
      "УСЛУГИ": "УСЛУГИ",
      "КОНТАКТЫ": "КОНТАКТЫ",
      "HERO_SUBTITLE": "ПРОМЫШЛЕННОЕ КАЧЕСТВО ДЛЯ ВАШИХ ЗАДАЧ",
      "HERO_DESCRIPTION": "Нужны уникальные детали, аксессуары для интерьера или кастомные изделия для бизнеса? С Connector реализовать любой, даже самый необычный проект, стало просто. Мы берем на себя все: от разработки технологии до размещения заказа на лучших производственных площадках Грузии.",
      "HERO_STEPS_TITLE": "Ваша идея в 4 шага",
      "STEP_1_TITLE": "ШАГ 1",
      "STEP_1_TEXT": "Загрузите свой эскиз, проект или рисунок. Мы принимаем файлы в любых форматах.",
      "STEP_2_TITLE": "ШАГ 2",
      "STEP_2_TEXT": "Получите консультацию и точный расчет стоимости вашего проекта от наших специалистов.",
      "STEP_3_TITLE": "ШАГ 3",
      "STEP_3_TEXT": "Подпишите онлайн договор на услуги. Все официально и безопасно, без поездок в офис.",
      "STEP_4_TITLE": "ШАГ 4",
      "STEP_4_TEXT": "Заберите готовый заказ самостоятельно или оформите быструю доставку до ваших дверей.",
      "Назад": "Назад",
      "Заказать проект": "Заказать услугу",
      "Оформить заказ": "Оформить заказ",
      "Выбранная услуга": "Выбранная услуга",
      "Имя": "Имя",
      "Введите имя": "Введите имя",
      "Фамилия": "Фамилия",
      "Введите фамилию": "Введите фамилию",
      "Контактные данные": "Контактные данные",
      "Телефон или Email": "LOGIN или EMAIL",
      "Техническое задание / Чертеж": "Техническое задание / Чертеж",
      "Выберите файл или перетащите": "Выберите файл или перетащите",
      "Комментарий к заказу": "Комментарий к заказу",
      "Опишите детали проекта...": "Опишите детали проекта...",
      "Подтвердить заказ": "Подтвердить заказ",
      "Нажимая кнопку, вы соглашаетесь с условиями обслуживания": "Нажимая кнопку, вы соглашаетесь с условиями обслуживания",
      "Добавить услуги": "Выберите услугу",
      "Выбранные услуги": "Список услуг",
      "Подтвердить выбор": "Подтвердить выбор",
      "Вход в систему": "Вход в систему",
      "Регистрация": "Регистрация",
      "Войти через Google": "Войти через Google",
      "или": "или",
      "Ваше имя": "Ваше имя",
      "Email": "Email",
      "Пароль": "Пароль",
      "Войти": "Войти",
      "Создать аккаунт": "Создать аккаунт",
      "Нет аккаунта? Создать": "Нет аккаунта? Зарегистрироваться",
      "Уже есть аккаунт? Войти": "Уже есть аккаунт? Войти",
      "Вход": "Войти",
      "Выберите хотя бы одну услугу":"Выберите хотя бы одну услугу",
      "Ваша форма на заказ успешно отправлена":"Ваша форма на заказ успешно отправлена",
      "менеджер обязательно с вами свяжеться !!!":"менеджер обязательно с вами свяжеться !!!",
      "Пожалуйста, войдите в свой аккаунт, чтобы оформить заказ":"Пожалуйста, войдите в свой аккаунт, чтобы оформить заказ",
      "ПРИМЕНИТЬ": "ПРИМЕНИТЬ",
      "Телефон":"Телефон",
      "Заказать":"Заказать",
      "Опишите ваши пожелания...":"Опишите ваши пожелания...",
      "Выбрано":"Выбрано",
      "Заказ принят!":"Заказ принят!",
      "Спасибо за доверие. Мы свяжемся с вами в ближайшее время для уточнения деталей.":"Спасибо за доверие. Мы свяжемся с вами в ближайшее время для уточнения деталей.",
      "Закрыть":"Закрыть",
      "profile_updated_success": "Профиль обновлен",
  "profile_updated_error": "Ошибка обновления профиля",
  "status_accepted": "Принят",
  "status_declined": "Отклонен",
  "status_pending": "Ожидает",
  "back_to_home": "На главную",
  "personal_account": "ЛИЧНЫЙ КАБИНЕТ",
  "logout": "Выйти",
  "placeholder_first_name": "Имя",
  "placeholder_last_name": "Фамилия",
  "placeholder_phone": "Телефон",
  "placeholder_city": "Город",
  "save": "Сохранить",
  "cancel": "Отмена",
  "statistics": "Статистика",
  "stat_orders": "Заказов",
  "stat_new": "Новых",
  "stat_accepted": "Принятых",
  "my_orders": "МОИ ЗАКАЗЫ",
  "no_orders": "У вас пока нет активных заказов",
  "make_order": "Сделать заказ",
  "order_number": "ЗАКАЗ",
  "selected_services": "ВЫБРАННЫЕ УСЛУГИ",
  "client_data": "ДАННЫЕ КЛИЕНТА",
  "comment": "КОММЕНТАРИЙ",
  "support_chat": "ЧАТ С ПОДДЕРЖКОЙ",
  "support_chat_description": "Свяжитесь с нами через виджет чата на главной странице",
      "open_chat": "Открыть чат",
      "doc_sign_card_title": "Документ на подпись",
      "doc_sign_card_hint": "Файл приложен к сообщению ниже",
      "open": "Открыть",
      "open_document": "Открыть документ",
      "open_full": "Открыть полностью",
      "preview_unavailable": "Предпросмотр недоступен",
      "sign_field": "Поле подписи",
      "sign_draw_and_send": "Нарисуйте вашу подпись и отправьте",
      "legal_title": "Внимание",
      "legal_text": "Подписывая данный контракт, вы подтверждаете согласие с условиями, и документ вступает в юридическую силу. Продолжить?",
      "agree": "Согласен",
      "scale": "Масштаб",
      "sign_modal_title": "Подписать документ",
      "sign_draw_send_manager": "Нарисуйте подпись и отправьте менеджеру",
      "sign_and_send": "Подписать и отправить",
      "sign_sent_success": "Документ подписан и отправлен менеджеру",
      "sign_send_error": "Не удалось отправить подпись",
      "open_pdf": "Открыть PDF",
      "view": "Просмотреть",
      "sign": "Подписать",
      "reject": "Отклонить",
      "sign_place_label": "Место подписи",
      "doc_already_signed": "Документ уже подписан",
      "sign_draw_label": "Подпишите",
      "clear": "Очистить",
      "loading": "Загрузка...",
      "not_found": "Не найдено",
      "reject_success": "Вы отклонили документ. Менеджер уведомлён.",
      "doc_signed_by_client": "Документ подписан клиентом",
      "doc_rejected_by_client": "Документ отклонён клиентом",
      "document": "Документ",
      "manager_signature": "Подпись менеджера",
      "client_signature": "Подпись клиента",
      "file": "Файл",
      "SETTINGS": "Настройки",
      "MP_PANEL": "Панель управления",
      "MP_MENU": "Меню",
      "MP_NAVIGATION": "Навигация по панели",
      "MP_DASHBOARD": "Панель управления",
      "MP_CHATS": "Чаты",
      "MP_ORDERS": "Заказы",
      "MP_CLIENTS": "Клиенты",
      "MP_SCRIPTS": "Скрипты",
      "MP_STATS": "Статистика",
      "LOGOUT": "Выйти",
      "INSTALL_APP": "Скачать приложение",
      "INSTALL_APP_DESC": "Чтобы установить приложение:\n• На Android (Chrome): меню браузера → Добавить на главный экран\n• На iOS (Safari): Поделиться → На экран «Домой»\nЕсли доступен системный запрос установки, используйте кнопку выше.",
      "CANCEL": "Отмена",
      "HOW_IT_WORKS_BTN": "КАК ЭТО РАБОТАЕТ",
      "TERMS_TITLE": "КАК РАБОТАЕТ CONNECTOR",
      "TERMS_S1_TITLE": "01. РЕГИСТРАЦИЯ",
      "TERMS_S1_TEXT": "Создайте личный кабинет за 1 минуту. Это позволит вам отслеживать статус ваших заказов в реальном времени, хранить историю переписки и загруженные чертежи.",
      "TERMS_S2_TITLE": "02. КОНСУЛЬТАЦИЯ",
      "TERMS_S2_TEXT": "Есть вопросы? Напишите нам в встроенный чат или выберите удобную соцсеть (Telegram, WhatsApp) прямо на сайте. Мы поможем определиться с материалом или технологией.",
      "TERMS_S3_TITLE": "03. ОФОРМЛЕНИЕ ЗАКАЗА",
      "TERMS_S3_TEXT": "Выберите нужную услугу в форме «Оформить заказ», прикрепите файлы (чертежи/макеты) и оставьте комментарий.",
      "TERMS_S4_TITLE": "04. ОБРАБОТКА МЕНЕДЖЕРОМ",
      "TERMS_S4_TEXT": "Ваша заявка мгновенно попадает к менеджеру. Мы проанализируем техническую возможность, рассчитаем стоимость и обязательно свяжемся с вами для подтверждения деталей.",
      "TERMS_S5_TITLE": "05. ДОГОВОР И СЧЁТ",
      "TERMS_S5_TEXT": "После утверждения всех деталей заказа вам будет отправлена ссылка на подписание договора выполнения услуг и выставлен счёт на оплату.",
      "TERMS_S6_TITLE": "06. ОПЛАТА",
      "TERMS_S6_TEXT": "Оплачивайте удобным вам способом на наш расчётный счёт.",
      "TERMS_S7_TITLE": "07. ПОЛУЧЕНИЕ ЗАКАЗА",
      "TERMS_S7_TEXT": "По готовности заказа получите ваши детали доставкой либо заберите самостоятельно (в зависимости от договорённостей).",
  "Повторить пароль":"Повторить пароль",
  "Логин":"Логин",
  "Логин или Email":"Логин или Email",
  'Уведомление':'Уведомление',
   'Чтобы заказать услугу, сначала войдите': 'Чтобы заказать услугу, сначала войдите',
   'Отмена':'Отмена',
   "Примечание менеджера:": "ИНФОРМАЦИЯ ОБ ЗАКАЗЕ:",
"Дата: ": "Дата готовности: ",
"Цена: ": "Цена: ",
"Комментарий:": "Комментарий:",
"Файлы заказа:": "Файлы заказа:",
      
      

      "S1_T": "Гибочные работы по металлам",
      "S1_D": `ЧПУ Гибка Листовых Металлических Материалов (Press Brake): Высокоточное Формирование Деталей

Гибка листового металла на станках с числовым программным управлением (ЧПУ) – это процесс холодного формования, который позволяет создавать объемные детали с заданными углами и радиусами.

Принцип Действия Станка:

Процесс гибки осуществляется с помощью гидравлического или электромеханического пресса. Листовой материал заготовки помещается между двумя основными элементами:
Матрица (V-образная канавка): Неподвижная нижняя часть, определяющая форму изгиба.
Пуансон (клинообразный инструмент): Подвижная верхняя часть, которая опускается и вдавливает лист в матрицу.
Станок, работающий с усилием до 300 тонн, обеспечивает точное и мощное давление, необходимое для пластической деформации даже толстых и высокопрочных металлических листов. ЧПУ система контролирует глубину опускания пуансона и положение задних упоров, гарантируя высокую повторяемость и точность угла гиба.

Ключевые технологические особенности:
Прецизионность: Точность угла гиба до 0.1 градуса.
Высокая производительность: Автоматизация и ЧПУ-управление ускоряют процесс изготовления серийных деталей.
Снижение стоимости: Замена сварных соединений гибкой уменьшает количество технологических операций.
Обрабатываемые материалы:
Углеродистые (черные) стали.
Нержавеющие стали.
Оцинкованные стали.
Алюминиевые сплавы.
Медные и латунные листы.
Технология незаменима в машиностроении, строительстве, производстве корпусов и элементов вентиляционных систем.`,



      "S2_T": "Жидкостная окраска",
      "S2_D": `Традиционное Жидкостное Нанесение Краски: Искусство Цвета и Персонализации

Жидкостное нанесение лакокрасочных материалов — это классическая технология, использующая жидкие составы для создания защитно-декоративного покрытия. В отличие от порошковой окраски, этот метод требует многослойного нанесения.

Технологические этапы и возможности:
Подготовка и Грунты: Процесс начинается с нанесения грунтов (праймеров), которые обеспечивают антикоррозийную защиту и максимальную адгезию основного слоя краски к поверхности.
Широкий Спектр: Технология предоставляет невероятно широкую палитру цветов и оттенков (включая металлики, перламутры), а также позволяет работать практически с любыми материалами, включая металлы, пластик, дерево и стекловолокно.
Финишные Лаки: Для придания глубины, блеска и дополнительной защиты используются прозрачные лаки, которые обеспечивают высокую стойкость к внешним факторам.
Спецэффекты: Метод незаменим для создания художественных эффектов: градиентов, переходов цвета, аэрографии и прочих дизайнерских решений, недоступных для порошкового метода.
Фактор Стоимости и Качества:

Ключевая особенность этой услуги – необходимость участия высококвалифицированного маляра. Качество и равномерность покрытия, а также реализация сложных эффектов, напрямую зависят от мастерства специалиста. Следовательно, из-за высокой доли ручного труда и требований к квалификации персонала, традиционное жидкостное нанесение краски является более дорогой, но и более гибкой в плане дизайна услугой.`,



      "S3_T": "Лазерная гравировка",
      "S3_D": `Лазерная гравировка — это современный способ нанесения изображений и надписей, при котором тонкий лазерный луч испаряет верхний слой материала. Это не просто печать, это изменение структуры поверхности, что делает изображение практически вечным.

Преимущества нашего метода:

Долговечность: Гравировка не стирается, не выцветает на солнце и не боится влаги. Она остается на изделии столько же, сколько служит сам предмет.

Ювелирная точность: Мы работаем с детализацией до 0,01 мм. Это позволяет наносить даже сложные логотипы, мелкие шрифты и детальные фотографии.

Безопасность для изделия: Бесконтактный метод исключает деформацию или повреждение предмета.

Универсальность: Работаем с металлом, деревом, кожей, стеклом, пластиком и камнем.`,



      "S4_T": "Лазерная резка металлов",
      "S4_D": `Лазерная Резка Металлов: Принцип и Технологические Особенности

Лазерная резка – это высокоточный метод термической обработки материалов, основанный на использовании сфокусированного лазера. Луч высокой мощности направляется на поверхность металла, мгновенно нагревая и расплавляя или испаряя его в точке контакта.

Для удаления расплава и продуктов горения из зоны реза используется вспомогательный газ (кислород, азот или воздух), подаваемый под давлением. Этот процесс позволяет получать узкий, чистый рез с минимальной зоной термического влияния (ЗТВ), что практически исключает деформацию заготовки.

Ключевые технологические характеристики:
Прецизионность: Достигается точность позиционирования до десятых и сотых долей миллиметра.
Универсальность: Эффективно применяется для черных, нержавеющих сталей, а также цветных металлов (алюминий, медь).
Качество кромки: Кромка реза получается гладкой, не требующей последующей механической обработки.
Программное управление: ЧПУ обеспечивает высокую повторяемость и возможность изготовления деталей сложной конфигурации.
Эта технология является оптимальной для задач, требующих высокой точности и чистоты реза.`,



      "S5_T": "Лазерная Резка и Гравировка Неметаллических Материалов",
      "S5_D": `Лазерная Резка и Гравировка Неметаллических Материалов (CO2-Лазер)

Лазерная обработка неметаллических материалов, как правило, осуществляется с помощью CO2-лазеров, генерирующих луч с длиной волны около 10,6 мкм. Принцип действия основан на высокоточной термической сублимации: сфокусированный луч мгновенно нагревает материал, вызывая его испарение или плавление по заданному контуру.

Процесс обеспечивает получение точных, узких резов и минимизирует зону теплового воздействия (ЗТВ), что сохраняет свойства материала. В режиме гравировки лазер контролируемо снимает тонкий верхний слой, создавая рельефное или цветовое изображение.

Ключевые технологические особенности:
Контроль глубины: Высокая управляемость позволяет выполнять как сквозную резку, так и поверхностную гравировку.
Прецизионность: Точность позиционирования, обеспечиваемая системами ЧПУ, гарантирует высокую повторяемость изделий.
Чистота обработки: Отсутствие механического контакта исключает износ инструмента и обеспечивает гладкую кромку.
CO2-лазер эффективно режет и гравирует следующие материалы:
Органическое стекло (акрил)
Фанера и дерево
Картон и бумага
Кожа, текстиль и фетр
Резина
Различные виды пластиков (за исключением ПВХ)
Эта технология незаменима для производства сувенирной продукции, рекламных конструкций и высокоточных дизайнерских элементов.`,



      "S6_T": "Порошковая окраска",
      "S6_D": `Порошковая окраска – это современная технология получения высококачественных защитно-декоративных покрытий без использования жидких растворителей. Метод обеспечивает исключительную долговечность, экологичность и экономичность.

Принцип Технологии:

Процесс основан на электростатическом нанесении порошка. Частицы полимерной краски заряжаются в специальном пистолете (аппликаторе) и распыляются на заземленное металлическое изделие. За счет электростатического притяжения порошок равномерно оседает на всей поверхности, включая сложные формы.

После нанесения изделие перемещается в камеру полимеризации, где при температуре 160–200 °C порошок плавится и образует монолитное покрытие. Скорость процесса высока, поскольку он не требует долгого высыхания – покрытие готово сразу после остывания изделия.

Ключевые характеристики покрытия:
Твердость и износостойкость: Слой краски обладает высокой твердостью, устойчив к механическим повреждениям, истиранию и химическим воздействиям.
Высокая адгезия: За счет полимеризации покрытие прочно сцепляется с металлом.
Идеальная равномерность: Электростатическое поле гарантирует однородность слоя по всей площади, исключая подтеки и пропуски.
Широкие возможности: Метод позволяет использовать богатую палитру цветов и текстур (глянец, мат, муар, шагрень).
Порошковая окраска незаменима для деталей, эксплуатируемых в агрессивных средах или требующих эстечески безупречного и долговечного покрытия.`,



      "S7_T": "Продажа материалов",
      "S7_D": `Продажа Специализированных Материалов: Редкий Ассортимент для Уникальных Проектов

Успех проекта часто зависит от качества и доступности исходных материалов. Мы предлагаем ассортимент, который сложно найти в широкой розничной продаже, обеспечивая вас именно тем, что нужно для безупречного результата.

Наш каталог включает:
Специализированные Краски: Уникальные лакокрасочные составы, обеспечивающие особые защитные и декоративные свойства, недоступные в стандартных сериях.
Цветные Металлы: Редкий Ассортимент Сплавов: медь, латунь, специальные марки алюминия для высокотехнологичных задач.
Экзотические Породы Древесины и Материалы:
Древесина разных пород с мебельной влажностью.
Термомодифицированная древесина, устойчивая к влаге и деформации.
Инженерные Элементы: Высокопрочные и специфические элементы крепежа, а также другие комплектующие для профессионального применения.
Мы поставляем материалы, отвечающие строгим промышленным стандартам, что гарантирует надежность и долговечность ваших изделий.`,



      "S8_T": "Сварка",
      "S8_D": `Сварка — это фундаментальный технологический процесс получения неразъемных соединений путем сплавления свариваемых деталей при их локальном или общем нагреве. В зависимости от типа энергии и защитной среды выделяют несколько ключевых методов:
MIG (Metal Inert Gas) / MAG (Metal Active Gas) Сварка:
Принцип: Проволочный электрод непрерывно подается в зону сварки, где расплавляется электрической дугой. Зона защищена от атмосферы газом: инертным (MIG, например, аргон) или активным (MAG, например, смесь аргона с CO2).
Преимущества: Высокая скорость, возможность автоматизации процесса, что делает его оптимальным для серийного производства. MAG чаще используется для углеродистых сталей, а MIG — для цветных металлов.
TIG (Tungsten Inert Gas) Сварка:
Принцип: Используется неплавящийся вольфрамовый электрод. Присадочный материал подается в зону отдельно или не используется. Сварочная зона и электрод защищены чистым инертным газом (аргон, гелий).
Преимущества: Исключительное качество и чистота шва, минимальное разбрызгивание, прецизионность и полный контроль над процессом. Это незаменимый метод для сварки тонких металлов, нержавеющей стали и алюминия.
Лазерная Сварка (Laser Welding):
Принцип: Соединение происходит под действием высококонцентрированного лазерного луча. Энергия луча мгновенно расплавляет кромки деталей с высокой скоростью. Процесс часто требует минимального или не требует присадочного материала.
Преимущества: Сверхмалая зона термического влияния (ЗТВ), что исключает деформацию. Высокая скорость, точность, возможность сваривать разнородные материалы и тонколистовой металл с глубоким проплавлением.
Эти методы обеспечивают прочные и надежные соединения, являясь основой современного машиностроения и металлообработки, позволяя решать широкий спектр инженерных задач.`,



      "S9_T": "Традиционная Механическая Обработка",
      "S9_D": `Токарные и Фрезерные Работы

Традиционная механическая обработка — это фундаментальный метод создания металлических и других деталей, основанный на обработке металла резанием. Она включает два основных и взаимодополняющих процесса:

1. Токарная Обработка

Применяется для формирования деталей, имеющих форму тел вращения (втулки, валы, оси, диски).
Принцип: Заготовка жестко закрепляется в патроне и приводится во вращение. Резец, управляемый оператором с помощью маховиков суппорта, вручную или за счет механизированных подач перемещается вдоль или поперек оси вращения, снимая слой материала.
Возможности: Выполнение обточки, подрезки торцов, растачивания внутренних отверстий и нарезание резьбы.
2. Фрезерная Обработка

Используется для обработки плоских, фасонных поверхностей, пазов, канавок и корпусных деталей со сложной геометрией.
Принцип: Главное движение совершает многолезвийный вращающийся инструмент — фреза. Заготовка, закрепленная на рабочем столе, перемещается вручную или с помощью механизированных подач, формируя необходимый контур.
Возможности: Создание плоских поверхностей, выборка пазов и карманов, обработка уступов. Эффективна для раскроя и формообразования деталей, не являющихся телами вращения.
-----Обратите внимание: в скором будущем в нашем арсенале будет доступна высокоточная обработка на пятиосевом ЧПУ станке, но на текущий момент эта услуга еще не предоставляется.`,


      "S10_T": "ЧПУ фрезеровка",
      "S10_D": `Фрезеровка на станках с ЧПУ (CNC Router) – это высокоэффективный метод механической обработки, основанный на удалении материала с помощью вращающейся фрезы. Технология позволяет выполнять как точную фрезеровку элементов, так и скоростной раскрой крупноформатных листовых материалов, обеспечивая чистый рез и высокую повторяемость.

Технологические режимы:
2D-фрезеровка: Применяется для плоского раскроя, вырезки контуров, создания пазов, отверстий и гравировки на одной плоскости.
3D-фрезеровка: Используется для изготовления объемных изделий, создания рельефов за счет точного синхронного управления по трем осям (X, Y, Z).
Современные станки оснащаются системой автоматической смены инструмента (ATC). Эта ключевая особенность позволяет оборудование самостоятельно менять фрезы, необходимые для разных этапов обработки (например, для чернового раскроя и чистовой фрезеровки), без участия оператора. Это значительно ускоряет выполнение сложных и многооперационных проектов.

Обрабатываемые материалы:
Древесные: Фанера, МДФ, ДСП, массив дерева.
Пластиковые: Оргстекло (акрил), ПВХ, поликарбонат, ПЭТ.
Композитные: Алюминиевые композитные панели (АКП).
Технология ЧПУ фрезеровки незаменима в производстве мебели, наружной рекламы и сложных дизайнерских элементов.`


    }
  },

  
  en: {
    translation: {
      "ГЛАВНАЯ": "HOME",
      "УСЛУГИ": "SERVICES",
      "КОНТАКТЫ": "CONTACTS",
      "HERO_SUBTITLE": "INDUSTRIAL QUALITY FOR YOUR TASKS",
      "HERO_DESCRIPTION": "Need unique parts, interior accessories, or custom products for your business? With Connector, realizing any project even the most unusual has become simple. We handle everything: from technological development to placing the order at the best manufacturing facilities in Georgia",
      "HERO_STEPS_TITLE": "Your idea in 4 steps",
      "STEP_1_TITLE": "STEP 1",
      "STEP_1_TEXT": "Upload your sketch, project or drawing. We accept files in any format.",
      "STEP_2_TITLE": "STEP 2",
      "STEP_2_TEXT": "Get a consultation and an exact calculation of your project cost.",
      "STEP_3_TITLE": "STEP 3",
      "STEP_3_TEXT": "Sign an online service agreement. Everything is official and safe.",
      "STEP_4_TITLE": "STEP 4",
      "STEP_4_TEXT": "Pick up the finished order yourself or arrange fast delivery.",
      "Назад": "Back",
      "Заказать проект": "Order Service",
      "Оформить заказ": "Place Order",
      "Выбранная услуга": "Selected Service",
      "Имя": "First Name",
      "Введите имя": "Enter name",
      "Фамилия": "Last Name",
      "Введите фамилию": "Enter last name",
      "Контактные данные": "Contact Data",
      "Телефон или Email": "LOGIN OR EMAIL",
      "Техническое задание / Чертеж": "Technical Drawing",
      "Выберите файл или перетащите": "Select file or drag",
      "Комментарий к заказу": "Comments",
      "Опишите детали проекта...": "Describe details...",
      "Подтвердить заказ": "Confirm Order",
      "Нажимая кнопку, вы соглашаетесь с условиями обслуживания": "By clicking, you agree to the terms",
      "Добавить услуги": "Select Services",
      "Выбранные услуги": "Services List",
      "Подтвердить выбор": "Confirm",
      "Вход в систему": "Login",
      "Регистрация": "Registration",
      "Войти через Google": "Sign in with Google",
      "или": "or",
      "Ваше имя": "Your Name",
      "Email": "Email",
      "Пароль": "Password",
      "Войти": "Sign In",
      "Создать аккаунт": "Create Account",
      "Нет аккаунта? Создать": "Don't have an account? Sign up",
      "Уже есть аккаунт? Войти": "Already have an account? Log in",
      "Вход": "Log in",
      "Выберите хотя бы одну услугу": "Выберите хотя бы одну услугу",
      "Ваша форма на заказ успешно отправлена":"Ваша форма на заказ успешно отправлена",
      "менеджер обязательно с вами свяжеться !!!":"менеджер обязательно с вами свяжеться !!!",
      "Пожалуйста, войдите в свой аккаунт, чтобы оформить заказ":"Пожалуйста, войдите в свой аккаунт, чтобы оформить заказ",
      "ПРИМЕНИТЬ": "CONFIRM",
      "Телефон": "Phone Number",
      "Город": "City",
      "Заказать": "ORDER",
      "Опишите ваши пожелания...":"Describe your wishes...",
      "Выбрано":"Selected",
      "Заказ принят!":"Order accepted!",
      "Спасибо за доверие. Мы свяжемся с вами в ближайшее время для уточнения деталей.":"Thank you for your trust. We will contact you shortly to clarify the details.",
      "Закрыть":"Close",
      "profile_updated_success": "Profile updated successfully",
  "profile_updated_error": "Error updating profile",
  "status_accepted": "Accepted",
  "status_declined": "Declined",
  "status_pending": "Pending",
  "back_to_home": "Back to home",
  "personal_account": "PERSONAL ACCOUNT",
  "logout": "Logout",
  "placeholder_first_name": "First Name",
  "placeholder_last_name": "Last Name",
  "placeholder_phone": "Phone",
  "placeholder_city": "City",
  "save": "Save",
  "cancel": "Cancel",
  "statistics": "Statistics",
  "stat_orders": "Orders",
  "stat_new": "New",
  "stat_accepted": "Accepted",
  "my_orders": "MY ORDERS",
  "no_orders": "You don't have any active orders yet",
  "make_order": "Make an order",
  "order_number": "ORDER",
  "selected_services": "SELECTED SERVICES",
  "client_data": "CLIENT DATA",
  "comment": "COMMENT",
  "support_chat": "SUPPORT CHAT",
  "support_chat_description": "Contact us via the chat widget on the home page",
      "open_chat": "Open chat",
      "doc_sign_card_title": "Document to sign",
      "doc_sign_card_hint": "File is attached to the message below",
      "open": "Open",
      "open_document": "Open document",
      "open_full": "Open fully",
      "preview_unavailable": "Preview unavailable",
      "sign_field": "Signature field",
      "sign_draw_and_send": "Draw your signature and send",
      "legal_title": "Attention",
      "legal_text": "By signing this contract, you confirm your agreement to the terms, and the document becomes legally binding. Continue?",
      "agree": "Agree",
      "scale": "Scale",
      "sign_modal_title": "Sign the document",
      "sign_draw_send_manager": "Draw your signature and send to the manager",
      "sign_and_send": "Sign and send",
      "sign_sent_success": "Document signed and sent to the manager",
      "sign_send_error": "Failed to send signature",
      "open_pdf": "Open PDF",
      "view": "View",
      "sign": "Sign",
      "reject": "Reject",
      "sign_place_label": "Signature location",
      "doc_already_signed": "Document already signed",
      "sign_draw_label": "Sign",
      "clear": "Clear",
      "loading": "Loading...",
      "not_found": "Not found",
      "reject_success": "You declined the document. The manager has been notified.",
      "doc_signed_by_client": "Document signed by the client",
      "doc_rejected_by_client": "Document declined by the client",
      "document": "Document",
      "manager_signature": "Manager's signature",
      "client_signature": "Client's signature",
      "file": "File",
      "SETTINGS": "Settings",
      "MP_PANEL": "Admin Panel",
      "MP_MENU": "Menu",
      "MP_NAVIGATION": "Panel navigation",
      "MP_DASHBOARD": "Dashboard",
      "MP_CHATS": "Chats",
      "MP_ORDERS": "Orders",
      "MP_CLIENTS": "Clients",
      "MP_SCRIPTS": "Scripts",
      "LOGOUT": "Logout",
      "INSTALL_APP": "Install App",
      "INSTALL_APP_DESC": "To install the mobile app:\n• On Android (Chrome): open browser menu → Add to Home screen\n• On iOS (Safari): Share → Add to Home Screen\nIf the install prompt is available, use the button above.",
      "CANCEL": "Cancel",
      "HOW_IT_WORKS_BTN": "HOW IT WORKS",
      "TERMS_TITLE": "HOW CONNECTOR WORKS",
      "TERMS_S1_TITLE": "01. REGISTRATION",
      "TERMS_S1_TEXT": "Create your personal account in 1 minute. It lets you track order status in real time, keep chat history and uploaded drawings.",
      "TERMS_S2_TITLE": "02. CONSULTATION",
      "TERMS_S2_TEXT": "Have questions? Write to us in the embedded chat or choose Telegram or WhatsApp right on the site. We will help you select the right material or technology.",
      "TERMS_S3_TITLE": "03. PLACE AN ORDER",
      "TERMS_S3_TEXT": "Select the needed service in the Place Order form, attach files (drawings/layouts) and leave a comment.",
      "TERMS_S4_TITLE": "04. MANAGER PROCESSING",
      "TERMS_S4_TEXT": "Your request instantly goes to a manager. We will analyze feasibility, calculate the price and contact you to confirm the details.",
      "TERMS_S5_TITLE": "05. AGREEMENT & INVOICE",
      "TERMS_S5_TEXT": "After all order details are approved, we send you a link to sign the service agreement and issue the invoice for payment.",
      "TERMS_S6_TITLE": "06. PAYMENT",
      "TERMS_S6_TEXT": "Pay in a convenient way to our bank account.",
      "TERMS_S7_TITLE": "07. DELIVERY OR PICKUP",
      "TERMS_S7_TEXT": "When the order is ready, receive your parts by delivery or pick them up yourself (depending on arrangements).",
  "Повторить пароль":"Repeat password",
  "Логин":"username",
  "Логин или Email":"username or email:",
  'Уведомление':'Notification',
   'Чтобы заказать услугу, сначала войдите':'To order a service, please log in first.',
   'Отмена':'Cancel',
   "Примечание менеджера:": "ORDER INFORMATION:",
"Дата: ": "Readiness Date: ",
"Цена: ": "Price: ",
"Комментарий:": "Comment:",
"Файлы заказа:": "Order files:",



      


      "S1_T": "Metal Bending Services",

"S1_D": `CNC Sheet Metal Bending (Press Brake): High-Precision Part Forming

Sheet metal bending on Computer Numerical Control (CNC) machines is a cold-forming process that allows for the creation of three-dimensional parts with specified angles and radii.

Machine Operating Principle:

The bending process is carried out using a hydraulic or electromechanical press brake. The sheet metal workpiece is placed between two primary elements:

Die (V-shaped groove): The stationary bottom part that determines the shape of the bend.

Punch (wedge-shaped tool): The mobile upper part that descends and presses the sheet into the die.

Operating with a force of up to 300 tons, the machine provides the precise and powerful pressure required for the plastic deformation of even thick and high-strength metal sheets. The CNC system controls the punch stroke depth and the position of the back gauges, guaranteeing high repeatability and precision of the bend angle.

Key Technological Features:

Precision: Bend angle accuracy of up to 0.1 degrees.

High Productivity: Automation and CNC control accelerate the manufacturing process for mass-produced parts.

Cost Reduction: Replacing welded joints with bends reduces the number of technological operations.

Processable Materials:

Carbon (mild) steels.

Stainless steels.

Galvanized steels.

Aluminum alloys.

Copper and brass sheets.

This technology is indispensable in mechanical engineering, construction, and the production of enclosures and ventilation system components.`,


"S2_T": "Liquid Coating",

"S2_D": `Traditional Liquid Paint Application: The Art of Color and Personalization

Liquid application of paint and varnish materials is a classic technology that utilizes liquid compositions to create a protective and decorative coating. Unlike powder coating, this method requires multi-layer application.

Technological Stages and Capabilities:

Preparation and Primers: The process begins with the application of primers, which provide anti-corrosion protection and ensure maximum adhesion of the base coat to the surface.

Wide Spectrum: The technology offers an incredibly vast palette of colors and shades (including metallics and pearlescents) and allows for work with virtually any material, including metals, plastics, wood, and fiberglass.

Finishing Varnishes: To provide depth, gloss, and additional protection, transparent lacquers (clear coats) are used, ensuring high resistance to external factors.

Special Effects: This method is indispensable for creating artistic effects: gradients, color transitions, airbrushing, and other design solutions unattainable by the powder coating method.

The Cost and Quality Factor:

A key feature of this service is the necessity of a highly skilled painter. The quality and uniformity of the coating, as well as the execution of complex effects, directly depend on the specialist's craftsmanship. Consequently, due to the high proportion of manual labor and the requirements for personnel qualification, traditional liquid paint application is a more expensive service, yet more flexible in terms of design.`,


"S3_T": "Laser Engraving",

"S3_D": `Laser engraving is a modern method of applying images and inscriptions, where a thin laser beam evaporates the top layer of the material. This is not merely printing; it is an alteration of the surface structure, making the image practically eternal.

Advantages of our method:

Durability: The engraving does not wear off, does not fade in the sun, and is resistant to moisture. It remains on the product as long as the item itself lasts.

Jewelry-grade Precision: We work with a level of detail down to 0.01 mm. This allows for the application of even complex logos, small fonts, and detailed photographs.

Product Safety: The non-contact method eliminates deformation or damage to the object.

Versatility: We work with metal, wood, leather, glass, plastic, and stone.`,


"S4_T": "Laser Metal Cutting",

"S4_D": `Laser Metal Cutting: Principle and Technological Features

Laser cutting is a high-precision method of thermal material processing based on the use of a focused laser. A high-power beam is directed onto the metal surface, instantly heating and melting or evaporating it at the point of contact.

An assist gas (oxygen, nitrogen, or air) supplied under pressure is used to remove the melt and combustion products from the cutting zone. This process allows for a narrow, clean kerf with a minimal Heat-Affected Zone (HAZ), which practically eliminates workpiece deformation.

Key Technological Characteristics:

Precision: Positioning accuracy of up to tenths and hundredths of a millimeter is achieved.

Versatility: Effectively applied to carbon (mild) steels, stainless steels, as well as non-ferrous metals (aluminum, copper).

Edge Quality: The cut edge is smooth, requiring no subsequent mechanical machining.

Program Control: CNC (Computer Numerical Control) ensures high repeatability and the ability to manufacture parts with complex configurations.

This technology is optimal for tasks requiring high precision and a clean cut.`,


"S5_T": "Laser Cutting and Engraving of Non-Metallic Materials",

"S5_D": `Laser Cutting and Engraving of Non-Metallic Materials (CO2 Laser)

Laser processing of non-metallic materials is generally carried out using CO2 lasers, which generate a beam with a wavelength of approximately 10.6 μm. The operating principle is based on high-precision thermal sublimation: a focused beam instantly heats the material, causing it to evaporate or melt along a specified contour.

The process ensures precise, narrow cuts and minimizes the Heat-Affected Zone (HAZ), thereby preserving the material's properties. In engraving mode, the laser removes a thin top layer in a controlled manner, creating a relief or color-contrast image.

Key Technological Features:

Depth Control: High controllability allows for both through-cutting and surface engraving.

Precision: Positioning accuracy provided by CNC systems guarantees high repeatability of products.

Processing Cleanliness: The absence of mechanical contact eliminates tool wear and ensures a smooth edge.

The CO2 laser effectively cuts and engraves the following materials:

Organic glass (Acrylic)

Plywood and wood

Cardboard and paper

Leather, textiles, and felt

Rubber

Various types of plastics (with the exception of PVC)

This technology is indispensable for the production of souvenir products, advertising structures, and high-precision design elements.`,


"S6_T": "Powder Coating",

"S6_D": `Powder coating is a modern technology for producing high-quality protective and decorative coatings without the use of liquid solvents. The method provides exceptional durability, environmental friendliness, and cost-effectiveness.

Technology Principle:

The process is based on electrostatic powder application. Particles of polymer paint are charged in a special spray gun (applicator) and sprayed onto a grounded metal product. Due to electrostatic attraction, the powder settles uniformly over the entire surface, including complex shapes.

After application, the product is moved into a polymerization oven (curing chamber), where at a temperature of 160–200 °C, the powder melts and forms a monolithic coating. The process speed is high because it does not require long drying times—the coating is ready immediately after the product cools down.

Key Coating Characteristics:

Hardness and Wear Resistance: The paint layer possesses high hardness and is resistant to mechanical damage, abrasion, and chemical influences.

High Adhesion: Due to polymerization, the coating bonds firmly to the metal.

Perfect Uniformity: The electrostatic field guarantees layer homogeneity across the entire area, eliminating sags, drips, and gaps.

Vast Possibilities: The method allows for a rich palette of colors and textures (gloss, matte, moiré, shagreen/fine texture).

Powder coating is indispensable for parts operated in aggressive environments or those requiring an aesthetically flawless and durable finish.`,


"S7_T": "Material Sales",

"S7_D": `Sale of Specialized Materials: A Rare Selection for Unique Projects

The success of a project often depends on the quality and availability of the source materials. We offer an assortment that is difficult to find in general retail, providing you with exactly what is needed for a flawless result.

Our catalog includes:

Specialized Paints: Unique coating formulations providing specific protective and decorative properties unavailable in standard series.

Non-Ferrous Metals: A Rare Selection of Alloys: Copper, brass, and special grades of aluminum for high-tech applications.

Exotic Wood Species and Materials:

Various wood species with furniture-grade moisture content.

Thermally modified wood (Thermowood), resistant to moisture and deformation.

Engineering Elements: High-strength and specific fasteners, as well as other components for professional use.

We supply materials that meet strict industrial standards, which guarantees the reliability and durability of your products.`,


"S8_T": "Welding",

"S8_D": `Welding is a fundamental technological process for creating permanent joints by fusing parts together through local or general heating. Depending on the energy source and the shielding environment, several key methods are distinguished:

MIG (Metal Inert Gas) / MAG (Metal Active Gas) Welding:

Principle: A wire electrode is continuously fed into the welding zone, where it is melted by an electric arc. The zone is shielded from the atmosphere by a gas: either inert (MIG, e.g., Argon) or active (MAG, e.g., a mixture of Argon and CO2).

Advantages: High speed and the potential for process automation make it optimal for mass production. MAG is more commonly used for carbon steels, while MIG is used for non-ferrous metals.

TIG (Tungsten Inert Gas) Welding:

Principle: A non-consumable tungsten electrode is used. Filler material is either fed into the zone separately or not used at all. The welding zone and the electrode are protected by a pure inert gas (Argon, Helium).

Advantages: Exceptional weld quality and cleanliness, minimal spattering, precision, and total control over the process. This is an indispensable method for welding thin metals, stainless steel, and aluminum.

Laser Welding:

Principle: Joining occurs under the action of a highly concentrated laser beam. The beam's energy instantly melts the edges of the parts at high speed. The process often requires minimal or no filler material.

Advantages: An ultra-small Heat-Affected Zone (HAZ), which eliminates deformation. It offers high speed, precision, and the ability to weld dissimilar materials and thin-sheet metal with deep penetration.

These methods provide strong and reliable joints, serving as the foundation of modern mechanical engineering and metalworking, allowing for the resolution of a wide range of engineering tasks.`,


"S9_T": "Traditional Mechanical Machining",

"S9_D": `Turning and Milling Services

Traditional mechanical machining is a fundamental method of creating metal and other parts, based on the process of metal cutting. It includes two primary and complementary processes:

1. Turning (Lathe Operations)

Applied for the formation of parts shaped as bodies of revolution (bushings, shafts, axles, discs).

Principle: The workpiece is rigidly clamped in a chuck and set into rotation. A cutting tool, controlled by the operator using the carriage handwheels—either manually or through mechanical feeds—moves along or across the axis of rotation, removing a layer of material.

Capabilities: Execution of turning (OD), facing, boring of internal holes, and thread cutting.

2. Milling Operations

Used for machining flat or contoured surfaces, slots, grooves, and housing parts with complex geometry.

Principle: The primary motion is performed by a multi-edged rotating tool—the milling cutter. The workpiece, fixed to the work table, is moved manually or via mechanical feeds to form the required contour.

Capabilities: Creation of flat surfaces, machining of slots and pockets, and shoulder milling. It is effective for the sizing and shaping of parts that are not bodies of revolution.

----- Please note: In the near future, high-precision machining on a five-axis CNC machine will be available in our arsenal, but at the current moment, this service is not yet provided.`,


"S10_T": "CNC Milling",

"S10_D": `CNC Milling (CNC Router) is a highly efficient mechanical processing method based on material removal using a rotating cutter. The technology allows for both the precise milling of elements and high-speed cutting of large-format sheet materials, ensuring a clean cut and high repeatability.

Technological Modes:

2D Milling: Applied for flat cutting, contouring, and the creation of slots, holes, and engraving on a single plane.

3D Milling: Used for the manufacturing of three-dimensional products and the creation of reliefs through precise synchronous control along three axes (X, Y, Z).

Modern machines are equipped with an Automatic Tool Changer (ATC) system. This key feature allows the equipment to independently change the cutters required for different processing stages (for example, for rough cutting and finishing milling) without operator intervention. This significantly accelerates the execution of complex and multi-operation projects.

Processable Materials:

Wood-based: Plywood, MDF, Chipboard, solid wood.

Plastics: Organic glass (Acrylic), PVC, Polycarbonate, PET.

Composites: Aluminum Composite Panels (ACP).

CNC milling technology is indispensable in the production of furniture, outdoor advertising, and complex design elements.`
    }
      
  },

  


  ka: {
    translation: {
      "ГЛАВНАЯ": "მთავარი",
      "УСЛУГИ": "სერვისები",
      "КОНТАКТЫ": "კონტაქტი",
      "HERO_SUBTITLE": "საწარმო ხარისხი თქვენთვის საჭირო ამოცანებისთვის",
      "HERO_DESCRIPTION": "გჭირდებათ უნიკალური დეტალები, ინტერიერის აქსესუარები ან ბიზნესისთვის კასტომური ნაკეთობები? CONNECTOR-თან გამარტივდა ნებისმიერი, თუნდაც ყველაზე უჩვეულო პროექტის რეალიზება. ჩვენს თავზე ვიღებთ ყველაფერს: ტექნოლოგიის დამუშავებიდან საქართველოს საუკეთესო სააწარმოო მოედნებზე შეკვეთების განთავსებამდე.",
      "HERO_STEPS_TITLE": "თქვენი იდეა 4 ეტაპათ",
      "STEP_1_TITLE": "ეტაპი 1",
      "STEP_1_TEXT": " ჩატვირთეთ თქვენი ესკიზი, პრპექტი ან ნახატი. ვიღებთ ნებისმიერი ფორმატის ფაილებს",
      "STEP_2_TITLE": "ეტაპი 2",
      "STEP_2_TEXT": "მიიღეთ კონსულტაცია და თქვენი პროექტის ზუსტი ღირებულება ჩვენი სპეციალისტებისაგან",
      "STEP_3_TITLE": "ეტაპი 3",
      "STEP_3_TEXT": "მოაწერეთ ხელი მომსახურების ონლაინ ხელშეკრულებას. ყველაფერი ოფიციალურია და უსაფრთხო",
      "STEP_4_TITLE": "ეტაპი 4",
      "STEP_4_TEXT": "მიიღეთ მზა პროექტი პირადად ან გააფორმეთ თქვენს კარებამდე სწრაფი მიწოდება.",
      "Назад": "უკან",
      "Заказать проект": "მომსახურების შეკვეთა",
      "Оформить заказ": "შეკვეთის გაფორმება",
      "Выбранная услуга": "არჩეული სერვისი",
      "Имя": "სახელი",
      "Введите имя": "შეიყვანეთ სახელი",
      "Фамилия": "გვარი",
      "Введите фамилию": "შეიყვანეთ გვარი",
      "Контактные данные": "საკონტაქტო მონაცემები",
      "Телефон или Email": "LOGIN ან EMAIL",
      "Техническое задание / Чертеж": "ტექნიკური დავალება / ნახაზი",
      "Выберите файл или перетащите": "აირჩიეთ ფაილი",
      "Комментарий к заказу": "კომენტარი",
      "Опишите детали проекта...": "აღწერეთ დეტალები...",
      "Подтвердить заказ": "შეკვეთის დადასტურება",
      "Нажимая кнопку, вы соглашаетесь с условиями обслуживания": "ღილაკზე დაჭერით ეთანხმებით პირობებს",
      "Добавить услуги": "მომსახურების არჩევა",
      "Выбранные услуги": "მომსახურებების სია",
      "Подтвердить выбор": "დადასტურება",
      "Вход в систему": "სისტემაში შესვლა",
      "Регистрация": "რეგისტრაცია",
      "Войти через Google": "Google-ით შესვლა",
      "или": "ან",
      "Ваше имя": "თქვენი სახელი",
      "Email": "ელ-ფოსტა",
      "Пароль": "პაროლი",
      "Войти": "შესვლა",
      "Создать аккаунт": "ანგარიშის შექმნა",
      "Нет аккаунта? Создать": "არ გაქვთ ანგარიში? დარეგისტრირდით",
      "Уже есть аккаунт? Войти": "უკვე გაქვთ ანგარიში? შესვლა",
      "Вход": "შესვლა",
      "Выберите хотя бы одну услугу":"Выберите хотя бы одну услугу",
      "Ваша форма на заказ успешно отправлена":"Ваша форма на заказ успешно отправлена",
      "менеджер обязательно с вами свяжеться !!!":"менеджер обязательно с вами свяжеться !!!",
      "Пожалуйста, войдите в свой аккаунт, чтобы оформить заказ":"Пожалуйста, войдите в свой аккаунт, чтобы оформить заказ",
      "ПРИМЕНИТЬ": "დადასტურება",
      "Телефон": "თქვენი ნომერი",
      "Город": "ქალაქი",
      "Заказать":"შეკვეთა",
      "Опишите ваши пожелания...":"აღწერეთ თქვენი სურვილები..",
      "Выбрано":"არჩეული",
      "Заказ принят!":"შეკვეთა მიღებულია!",
      "Спасибо за доверие. Мы свяжемся с вами в ближайшее время для уточнения деталей.":"„გმადლობთ ნდობისთვის. დეტალების გასარკვევად მალე დაგიკავშირდებით.“",
      "Закрыть":"დახურვა",
      "profile_updated_success": "პროფილი განახლებულია",
  "profile_updated_error": "პროფილის განახლების შეცდომა",
  "status_accepted": "მიღებულია",
  "status_declined": "უარყოფილია",
  "status_pending": "მოლოდინშია",
  "back_to_home": "მთავარზე დაბრუნება",
  "personal_account": "პირადი კაბინეტი",
  "logout": "გასვლა",
  "placeholder_first_name": "სახელი",
  "placeholder_last_name": "გვარი",
  "placeholder_phone": "ტელეფონი",
  "placeholder_city": "ქალაქი",
  "save": "შენახვა",
  "cancel": "გაუქმება",
  "statistics": "სტატისტიკა",
  "stat_orders": "შეკვეთები",
  "stat_new": "ახალი",
  "stat_accepted": "მიღებული",
  "my_orders": "ჩემი შეკვეთები",
  "no_orders": "თქვენ ჯერ არ გაქვთ აქტიური შეკვეთები",
  "make_order": "შეკვეთის გაფორმება",
  "order_number": "შეკვეთა",
  "selected_services": "არჩეული მომსახურება",
  "client_data": "კლიენტის მონაცემები",
  "comment": "კომენტარი",
  "support_chat": "მხარდაჭერის ჩატი",
  "support_chat_description": "დაგვიკავშირდით ჩატის საშუალებით მთავარ გვერდზე",
      "open_chat": "ჩატის გახსნა",
      "doc_sign_card_title": "ხელმოსაწერი დოკუმენტი",
      "doc_sign_card_hint": "ფაილი მიმაგრებულია ქვემოთ მდებარე მესიჯზე",
      "open": "გახსნა",
      "open_document": "დოკუმენტის გახსნა",
      "open_full": "სრულად გახსნა",
      "preview_unavailable": "წინასწარი ნახვა მიუწვდომელია",
      "sign_field": "ხელმოწერის ველი",
      "sign_draw_and_send": "დახატეთ თქვენი ხელმოწერა და გაგზავნეთ",
      "legal_title": "ყურადღება",
      "legal_text": "ამ კონტრაქტზე ხელმოწერით თქვენ ადასტურებთ პირობებთან თანხმობას და დოკუმენტი იურიდიულ ძალას იღებს. გავაგრძელოთ?",
      "agree": "ვეთანხმები",
      "scale": "მასშტაბი",
      "sign_modal_title": "დოკუმენტის ხელმოწერა",
      "sign_draw_send_manager": "დახატეთ ხელმოწერა და გაუგზავნეთ მენეჯერს",
      "sign_and_send": "ხელმოწერა და გაგზავნა",
      "sign_sent_success": "დოკუმენტი ხელმოწერილია და გაგზავნილია მენეჯერს",
      "sign_send_error": "ხელმოწერის გაგზავნა ვერ მოხერხდა",
      "open_pdf": "PDF გახსნა",
      "view": "ნახვა",
      "sign": "ხელმოწერა",
      "reject": "უარყოფა",
      "sign_place_label": "ხელმოწერის ადგილი",
      "doc_already_signed": "დოკუმენტი უკვე ხელმოწერილია",
      "sign_draw_label": "ხელმოწერეთ",
      "clear": "გასუფთავება",
      "loading": "იტვირთება...",
      "not_found": "ვერ მოიძებნა",
      "reject_success": "თქვენ უარყავით დოკუმენტი. მენეჯერს შეატყობინეს.",
      "doc_signed_by_client": "დოკუმენტი ხელმოწერილია კლიენტის მიერ",
      "doc_rejected_by_client": "დოკუმენტი უარყოფილია კლიენტის მიერ",
      "document": "დოკუმენტი",
      "manager_signature": "მენეჯერის ხელმოწერა",
      "client_signature": "კლიენტის ხელმოწერა",
      "file": "ფაილი",
      "SETTINGS": "პარამეტრები",
      "MP_PANEL": "მართვის პანელი",
      "MP_MENU": "მენიუ",
      "MP_NAVIGATION": "პანელის ნავიგაცია",
      "MP_DASHBOARD": "დაშბორდი",
      "MP_CHATS": "ჩათები",
      "MP_ORDERS": "ორდერები",
      "MP_CLIENTS": "კლიენტები",
      "MP_SCRIPTS": "სკრიპტები",
      "LOGOUT": "გამოსვლა",
      "INSTALL_APP": "აპის დაყენება",
      "INSTALL_APP_DESC": "აპის დასაყენებლად:\n• Android (Chrome): ბრაუზერის მენიუ → Add to Home screen\n• iOS (Safari): Share → Add to Home Screen\nთუ სისტემური მოთხოვნა ხელმისაწვდომია, გამოიყენეთ ზემოთ მოცემული ღილაკი.",
      "CANCEL": "გაუქმება",
      "HOW_IT_WORKS_BTN": "როგორ მუშაობს",
      "TERMS_TITLE": "როგორ მუშაობს CONNECTOR",
      "TERMS_S1_TITLE": "01. რეგისტრაცია",
      "TERMS_S1_TEXT": "შექმენით პირადი კაბინეტი 1 წუთში. ეს საშუალებას მოგცემთ თვალი ადევნოთ შეკვეთების სტატუსს რეალურ დროში, შეინახოთ მიმოწერის ისტორია და ატვირთული ნახაზები.",
      "TERMS_S2_TITLE": "02. კონსულტაცია",
      "TERMS_S2_TEXT": "გაქვთ კითხვები? მოგვწერეთ ჩატში ან აირჩიეთ თქვენთვის მოსახერხებელი სოციალური ქსელი (Telegram, WhatsApp) პირდაპირ საიტზე. ჩვენ დაგეხმარებით მასალის ან ტექნოლოგიის შერჩევაში.",
      "TERMS_S3_TITLE": "03. შეკვეთის გაფორმება",
      "TERMS_S3_TEXT": "აირჩიეთ სასურველი მომსახურება ფორმაში „შეკვეთის გაფორმება“, დაურთეთ ფაილები (ნახაზები/მაკეტები) და დატოვეთ კომენტარი.",
      "TERMS_S4_TITLE": "04. მენეჯერის დამუშავება",
      "TERMS_S4_TEXT": "თქვენი განაცხადი მყისიერად გადაეცემა მენეჯერს. ჩვენ გავაანალიზებთ ტექნიკურ შესაძლებლობებს, გამოვთვლით ღირებულებას და აუცილებლად დაგიკავშირდებით დეტალების დასადასტურებლად.",
      "TERMS_S5_TITLE": "05. ხელშეკრულება და ინვოისი",
      "TERMS_S5_TEXT": "შეკვეთის ყველა დეტალის დადასტურების შემდეგ, ჩვენ გამოგიგზავნით ბმულს მომსახურების ხელშეკრულების ხელმოსაწერად და გადახდის ინვოისს.",
      "TERMS_S6_TITLE": "06. გადახდა",
      "TERMS_S6_TEXT": "გადაიხადეთ თქვენთვის მოსახერხებელი გზით ჩვენს საბანკო ანგარიშზე.",
      "TERMS_S7_TITLE": "07. მიწოდება ან გატანა",
      "TERMS_S7_TEXT": "როდესაც შეკვეთა მზად იქნება, მიიღეთ თქვენი ნაწილები მიწოდებით ან გაიტანეთ ისინი თავად (შეთანხმებისამებრ).",
  "Повторить пароль":"გაიმეორეთ პაროლი",
  "Логин":"მეტსახელი",
  "Логин или Email":"მეტსახელი ან ფოსტა",
  'Уведомление':'ყურადღება',
  'Чтобы заказать услугу, сначала войдите':'სერვისის შესაკვეთად, გთხოვთ, ჯერ გაიაროთ ავტორიზაცია.',
  'Отмена':'გაუქმება',
  "Примечание менеджера:": "ინფორმაცია შეკვეთის შესახებ:",
"Дата: ": "მზადყოფნის თარიღი: ",
"Цена: ": "ფასი: ",
"Комментарий:": "კომენტარი:",
"Файлы заказа:": "შეკვეთის ფაილები:",
     


      "S1_T": "ლითონის მოღუნვითი სამუშაოები",
      "S1_D": `რიცხვითი პროგრამული მართვა ფურცლოვანი მეტალის მასალების მოღუნვა (Press Brake): დეტალების მაღალი სიზუსტით ფორმირება
ფურცლის ლითონის ღუნვა რიცხვითი პროგრამული მართვის მქონე დაზგებზე - ეს ცივი ფორმირების პროცესია, რომელიც მითითებული კუთხეების და რადიუსების მქონე მოცულობითი დეტალების შექმნის საშუალებას იძლევა.
დაზგის მოქმედების პრინციპი:
ღუნვის პროცესი წარმოიშვება ჰიდრავლიკური ან ელექტრომექანიკური პრესის/წნეხის მეშვეობით.
ნამზადის ფურცელოვანი მასალა თავსდება ორ ძირითად ელემენტს შორის:
მატრიცა (V-მაგვარი მცირე ღარი): ღუნვის ფორმის განმსაზღვრელი უძრავი ქვედა ნაწილი,
პუანსონი (სოლისმაგვარი ინსტრუმენტი): მოძრავი ზედა ნაწილი, რომელიც ეშვება და ფურცელს მატრიცაში წნევით სვამს/ჩაზნექავს.
300-ტონამდე ძალით მომუშავე დაზგა უზრუნველყოფს ზუსტ და ძლიერ წნევას, რომელიც აუცილებელია სქელი და მაღალი გამძლეობის ლითონის ფურცლების პლასტიური დეფორმაციისათვის. რპმ-სისტემა აკონტროლებს პუანსონის დაშვების სიღრმეს და უკანა ბრჯენების მდგომარეობას, და  მაღალ გამეორების და ღუნვის კუთხის სიზუსტის გარანტიას უზრუნველყოფს.
	

საკვანძო ტექნოლოგიური თავისებურებანი:.
სიზუსტე: ღუნვის კუთხის 0.1 გრადუსამდე სიზუსტე.
მაღალი მწარმოებლობა: ავტომატიზაცია და რმპ-მართვა აჩქარებენ სერიული დეტალების დამზედების პროცესს.
ღირებულების შემცირება: შედუღებული შეერთებების ჩანაცვლება ღუნვით ამცირებს ტექნოლოგიური ოპერაციების რაოდენობას. დასამუშავებელი მასალები:
ნახშირბადიანი (შავი) ფოლადები
უჟანგავი ფოლადები
 მოთუთიებული ფოლადები
ალუმინის ნაერთები
სპილენძის და თითბერის ფურცლები
ტექნოლოგია შეუცვლელია მანქანათმშენებლობაში, მშენებლობაში, სავენტილაციო სისტემების ელემენტების და კორპუსების წარმოებაში.`,


      "S2_T": "თხევადი შეღებვა",
      "S2_D": `საღებავის ტრადიციულად თხევადი დატანა: ფერის და პერსონალიზაციის ხელოვნება
ლაქ-საღებავი მასალების თხევადი დატანება - ესაა კლასიკური ტექნოლოგია, რომელიც იყენებს თხევად შემადგენლობებს დამცავ-დეკორატიული დაფარვის შექმნისთვის. ფხვნილით შეღებვისგან განსხვავებით, ეს მეთოდი მოითხოვს მრავალი ფენის დატანას.
ტექნოლოგიური ეტაპები და შესაძლებლობები:
მომზადება და გრუნტები: პროცესი იწყება გრუნტის (პრაიმერის) დაფარვით, რომელიც უზრუნველყოფს ანტიკოროზიულ დაცვას და საღაბავის ძირითადი ფენის მაქსიმალურ დამაგრებას ზედაპირზე.
ფართო სპექტრი: ტექნოლოგია გვაძლევს ფერების და სხვადასხვა ტონალობის საოცრად ფართო პალიტრას (მეტალიკის და სადაფისფერის ჩათვლით), და ასევე ნებისმიერ მასალასთან მუშაობის საშუალებას იძლევა  მეტალების, პლასტიკის, ხის და მინაბოჭკოს ჩათვლით.
საბოლოო (ფინიშური) ლაქები: ფერში სიღრმის, ბზინვარების მისაღწევად და დამატებითი დაცვისთვის გამოიყენება გამჭირვალე ლაქები, რომლებიც უზრუნველყოფენ გარე ფაქტორების მიმართ მაღალ მდგრადობას.
სპეცეფექტები: მეთოდი შეუცვლელია სამხატვრო ეფექტების შექმნისთვის: გრადიენტების, ფერების გადასვლისთვის, აეროგრაფიის და სხვა დიზაინერული გადაწყვეტილებებისთვის, რომლებიც მიუდგომელია ფხვნილის მეთოდისთვის.

ღირებულების და ხარისხის ფაქტორი:
ამ სერვისის საკვანძო თვისებურება - აუცილებელია მაღალი კვალიფიკაციის მქონე მღებავის (მალიარის) მონაწილეობა. დაფარვის ხარისხი და თანაბრობა, და ასევე რთული ეფექტების შექმნა პირდაპირ დამოკიდებულია სპეციალისტის ოსტატობაზე. შესაბამისად, ხელის შრომის მაღალი წილისა და პერსონალის კვალიფიკაციის მოთხოვნიდან გამომდინარე, თხევადი შეღებვა როგორც წესი უფრო ძვირია, მაგრამ ამასთან დიზაინის სფეროში უფრო მოქნილი მომსახურების ფორმაა.`,


      "S3_T": "ლაზერული გრავირება",
      "S3_D": `ლაზერული გრავირება - ესაა გამოსახულებების და წარწერების დატანის თანამედროვე მეთოდი, რომლის დროს ლაზერის სხივი აორთქლებს მასალის ზედა შრეს. ეს არაა მარტივი ბეჭდვა, ესაა ზედაპირის სტრუქტურის ცვლილება, რაც გამოსახულებას თითქმის მარადს ხდის.  ჩვენი მეთოდის უპირატესობა:
ხანგამძლეობა: გრავირება არ იცვითება, არ ხუნდება მზეზე და არ ეშინია ნესტის. ის დარჩება ნაკეთობაზე თვით ამ საგნის მოხმარების ბოლომდე.
საიუველირო სიზუსტე: ჩვენ ვმუშაობთ 0.01 მმ-მდე სიზუსტით. ეს შეასაძლებლობას გვაძლევს დავიტანოთ ზედაპირზე რთული ლოგოტიპები, წვრილი შრიფტები და დეტალური ფოტოსურათები.
თავად ნაკეთობის უსაფრთხოება: უკონტაქტო მეთოდი გამორიცხავს საგნის დეფორმაციას ან დაზიანებას.
უნივერსალურობა:  ვმუშაობთ ლითონთან, ხესთან, ტყავთან, მინასთან, პლასტიკთან და ქვასთან`,

      "S4_T": "ლითონების ლაზერული ჭრა ",
      "S4_D": `ლითონების ლაზერული ჭრა: პრინციპი და ტექნოლოგიური თავისებურებები

ლაზერული ჭრა წარმოადგენს მასალების თერმული დამუშავების მაღალი სიზუსტის მეთოდს, რაც ეფუძნება ფოკუსირებული ლაზერის გამოყენებას. მაღალი სიძლიერის სხივი მიმართული ლითონის ზედაპირზე მომენტალურად აცხელებს, ადნობს ან აორთქლებს მას შეხების წერტილში.
ნადნობის და წვის პროდუქტების მოსაშორებლად ჭრის ზონიდან გამოიყენება დამხმარე აირი (ჟანგბადი, აზოტი ან ჰაერი) მიწოდებული მაღალი წნევით. ეს პროცესი გვაძლევს საშუალებას მივიღოთ წვრილი, სუფთა ჭრილი თერმული ზემოქმედების მინიმალური ზონით, რაც პრაქტიკულად გამორიცხავს ნამზადის დეფორმაციას.

საკვანძო ტექნოლოგიური მახასიათებლები:
პრეციზიულობა/სიზუსტე: მიღწევადია პოზიოციონირების სიზუსტე მილიმეტრის მეათადი და მეასედი წილით.
უნივერსალურობა: ეფექტურად გამოიყენება შავი, უჟანგავი ფოლადებისა და ასევე ფერადი ლითონებისთვის (ალუმინი, სპილენძი)
ჭრის ნაწიბურის ხარისხი: ჭრის ნაწიბური გამოდის გლუვი და არ საჭიროებს მომდევნო მექანიკურ დამუშავებას.
პროგრამული მართვა: რპმ უზრუნველყოფს გამეორების მაღალ შესაძლებლობას და რთული კონფიგურაციის დეტალების დამზადების საშუალებას.
ეს ტექნოლოგია ოპტიმალურია იმ დავალებების შესრულებისას, რომლებიც მოითხოვენ მაღალ სიზუსტეს და ჭრის წიბოს სისუფთავეს.`,

      "S5_T": "არალითონის მასალების ლაზერული ჭრა",
      "S5_D": `არალითონური მასალების ლაზერული ჭრა და გრავირება (СО-2-ლაზერი)
არალითონური მასალების ლაზერული დამუშავება როგორც წესი ხორციელდება С02-ლაზერით, რომელიც 10,6 მკმ სიგრძის ტალღიანი სხივის გენერირებას ახდენს. მოქმედების პრინციპი ეყრდნობა მაღალი სიზუსტის თერმულ სუბლიმაციას: ფოკუსირებული სხივი წამიერად აცხელებს მასალას, იწვევს რა მის აორთქლებას ან დნობას მიცემული კონტურით.
პროცესი უზრუნველყოფს ზუსტი, წვრილი ჭრილების მიღებას და ამცირებს თბური ზემოქმედების ზონას (თზზ), რაც მასალას უნარჩუნებს თავის თვისებებს.  გრავირების რეჟიმში ლაზერი აკონტროლებს ზედა თხელი ფენის მოხსნას, ქმნის რელიეფურ ან ფერად გამოსახულებას. 
სიღრმის კონტროლი: მაღალი მართვა საშუალებას იძლევა შევასრულოთ როგორც გამჭოლი, ასევე ზედაპირული გრავირება.
პრეციზიულობა/სიზუსტე: პოზიციონირების სიზუსტე, უზრუნველყოფილია ციფრული პროგრამული მართვის სისტემით, რას ნაკეთობის მაღალი გამეორების გარანტიას იძლევა.
დამუშავების სისუფთავე: მექანიკური კონტაქტის არარსებობა გამორიცხავს ინსტრუმენტის ცვეთას და უზრუნველყოფს ჭრის გლუვ ნაწიბურს.
CO2-ლაზერი ეფექტურად ჭრის და გრავირებას აკეთებს შემდეგ მასალებზე:
ორგანული მინა (აკრილი)
ფანერა და ხე
მუყაო და ქაღალდი
ტყავი, ტექსტილი და ფეტრი
 რეზინი
პლასტიკის სხვადასხვა სახეობა (ფვხ-ს გარდა)

ეს ტექნოლოგია შეუცვლელია სუვენირული პროდუქციის, სარეკლამო კონსტრუქციებისა და მაღალი სიზუსტის მქონე დიზაინერული ელემენტების წარმოებისას.
`,

      "S6_T": "ფხვნილოვანი შეღებვა",
      "S6_D": `ფხვნილოვანი შეღებვა - მაღალი ხარისიხის მქონე დამცავ-დეკორატიული დაფარვების მიღების თანამედროვე ტექნოლოგიაა თხევადი გამხსნელების გამოყენების გარეშე. მეთოდი უზრუნველყოფს გამორჩეულ ხანგრძლივობას, ეკოლოგიურობასა და ეკონომიურობას.
ტექნოლოგიის პრინციპი:
პროცესი ეფუძნება ფხვნილის ელექტროსტატიკურ დატანას. პოლიმერული საღებავის ნაწილაკებს ათავსებენ სპეციალურ პისტოლეტში (აპლიკატორში) და მოაფქრვევენ ლითონის დამიწებულ ნაკეთობაზე. ელექტროსტატიკური მიზიდულობით ფხვნილი თანაბრად ილექება მთელ ზედაპირზე, რთული ფომების ჩათვლით.
დატანის შემდეგ ნაკეთობა მიდის პოლიმერიზაციის კამერაში, სადაც 160-200 გრადუსის პირობებში ფხვნილი დნება და მონოლიტურ საფარველად იქცევა. პროცესის სიჩქარე მაღალია, რადგან ის არ საჭიროებს ხანგძლივ შრობას - ნაკეთობა მზადაა გაციებისთანავე.
დაფარვის საკვანძო მახასიათებლები:
სიმკვრივე და ცვეთის მიმართ მგრადობა: საღებავის ფენას გააჩნია მაღალი სიმკრივე, მექანიკური დაზიანების, ცვეთის და ქიმიური ზემოქმედების მიმართ მდგრადობა.
მაღალი ადგეზია/მიკვრა: პოლიმერიზაციის გამო საფარი ძლიერად ეკრობა ლითონს.
იდეალური სითანაბრე: ელექტროსტატიკური ველი გარანტიაა ფენის ერთგვაროვნების და გამორიცხავს ღვენთას და დეფექტებს.
ფართო შესაძლებლობები: მეთოდი გვაძლევს საშუალებას გამოვიყენოთ ფერების და ტექსტურების (გლუვი, მქრქალი, მუარი, შაგრენი) ფართო პალიტრა.
ფხვნილოვანი ღებვა შეუცვლელია დეტალებისთვის, რომელთა ექსპლუატაცია აგრესიულ პირობებში ხდება ან ითხოვს ესთეტურად უნაკლო და ხანგძლივ დაფარვას.`,

      "S7_T": "მასალების გაყიდვა",
      "S7_D": `სპეციალიზირებული მასალების გაყიდვა: იშვიათი ასორტიმენტი უნიკალური პროექტებისთვის
პროექტის წარმატება ხშირად ხარისხზე და მასალებზეა დამოკიდებული. ჩვენ გთავაზობთ ასორტიმენტს, რომლის პოვნა საცალო გაყიდვაში რთულია, და გაწვდით იმას რაც აუცილებელია უზადო შედეგის მისაღებად.
ჩვენი კატალოგი შეიცავს:
სპეციალიზირებულ საღებავებს: ლაქ-საღებავების უნიკალურ შენაერთებს, რომლებიც უზრუნველყოფენ ისეთ დამცავ და დეკორატიულ თვისებებს, რომლებიც სტანდარტულ სერიებში მიუღწეველია.
ფერადი ლითონები: იშვიათი შენადნობები და ლითონები, სპილენძის, თითბერის და ალუმინის სპეციალური მარკების ჩათვლით, მაღალ ტექნოლოგიური გადაწყვეტილებებისათვის.
ხის სხვადასხვა ჯიშები ავეჯისთვის მისაღები ტენიანობით
თერმომოდიფიცირებული ხის მასალა, ტენიანობისა და დეფორმაციის მიმართ მდგრადი
საინჟინრო ელემენტები: მაღალი გამძლეობის და სპეციფიური ელემენტების მქონე სამაგრები და ასევე სხვა პროფესიონალური გამოყენებისთვის საჭირო  საკომპლექტო ნაწილები.
ჩვენ შემოგვაქვს მასალა, რომლიც მკაცრ საწარმოო სტანდარტებს აკმაყოფილებს რაც თქვენი ნაკეთობების სანდოობის და ხანგრძლივობის გარანტიას იძლევა.`,

      "S8_T": "შედუღება",
      "S8_D": `შედუღება - ესაა ფუნდამენტალური ტექნოლოგიური პროცესი არა დაშლადი შეკავშირებების მისაღებად დეტალების შედუღების მეშვეობით მათი ლოკალური ან მთლიანი გახურებით.
ენერგიის ტიპის და დამცავი გარემოსგან გამომდინარე რამდენიმე საკვანძო მეთოდი იკვეთება:
MIG (Metal Inert Gas) / MAG (Metal Active Gas) შედუღება:
პრინციპი: მავრთულოვანი ელექტროდი უწყვეტლივ მიეწოდება შედუღების ზონაში, სადაც ის დნება ელექტრო რკალად. ზონა დაცულია ატმოსფეროსგან გაზით: ინერტულით ( MIG მაგალითად არგონი) ან აქტიურით  ( MAG მაგალითად არგონის ნაერთი CO2-სთან).
უპირატესობა: მაღალი სიჩქარე, პროცესის ავტომატიზაციის შესაძლებლობა, რაც მას სერიული წარმოებისთვის ოპტიმალურს ხდის. MAG უფრო ხშირად გამოიყენება ნახშირბადიანი ფოლადებისთვის, და MIG - ფერადი ლითონებისთვის.
TIG (Tungsten Inert Gas) შედუღება:
პრინციპი: გამოიყენება არადნობადი ვოლფრამის ელექტროდი. შემავსებელი მასალა მიეწოდება ზონაში ცალკე ან არ გამოიყენება. შედუღების ზონა და ელექტროდი დაცული არიან სუფთა ინერტული აირით (არგონი, ჰელიუმი)
უპირატესობა:  ნაკერის უზადო ხარისხი და სიწმინდე, მინიმალური შხეფები, 
პრეციზიულობა და პროცესზე სრული კონტროლი. ეს მეთოდი შეუცვლელია თხელი ლითონების, უჟანგავი ფოლადის და ალუმინის შედუღებისთვის. 
ლაზერული შედუღება (Laser Welding): 
პრინციპი: შეერთება ხდება მაღალკონცენტრირებული ლაზერილი სხივის ზემოქმედებით. სხივის ენერგია მაღალი სიჩქარით წამიერად ადნობს დეტალის ნაწიბურებს. პროცესი ხშირად საჭიროებს მინიმალურ შემავსებელ მასალას ან საერთოდ არ საჭიროებს მას.
უპირატესობა: ზემცირე თერმული ზემოქმედების ზონა (თზზ), რაც გამორიცხავს დეფორმაციას. მაღალი სიჩქარე, სიზუსტე, სხვადასხვაგვარი მასალების შედუღების და თხელფურცლოვანი ლითონის ღრმა შედუღების საშუალება.
ეს მეთოდები უზრუნველყოფენ მჭიდრო და საიმედო შენაერთებს, წარმოადგენენ თანამედროვე მანქანათმშენებლობის და ლითონის დამუშავების საფუძველს, საშუალებას იძლევიან გადავჭრათ საინჟინრო ამოცანების ფართო სპექტრი.`,

      "S9_T": "ტრადიციული მექანიკური დამუშავება",
      "S9_D": `სახარატო და საფრეზერო სამუშაოები
ტრადიციული მექანიკური დამუშავება - ეს არის ლითონის და სხვა მასალისგან დამზადებული დეტალების შექმნის ფუნდამენტალური მეთოდი, რომელიც ლითონის ჭრით დამუშავებას ეფუძნება. ის შეიცავს ორ ძირითად და ურთიერთშემავსემებელ პროცესს:
1.  სახარატო დამუშავება
გამოიყენება იმ დეტალების ფორმირებისთვის, რომელთაც ბრუნვისთვის ფორმა გააჩნიათ (მილისი, რგოლი, ლილვი, დისკი, ღერძი).
.
პრინციპი: ნამზადი მჭიდროდ მაგრდება  ვაზნაში და ბრუნვას იწყებს. საჭრელი, რომელსაც ოპერატორი მართავს სუპორტის მქნევარის დახმარებით, ხელით ან მექანიკურად გადაადგილდება ბრუნვის ღერძის გასწვრივ ან განივ, და მასალის ფენას ჭრის.
შესაძლებლობები: გაჩარხვის შესრულება, ტორსის მოჭრა, შიდა ხვრელების შიგჩარხვა და კუთხვილის ჭრა.
2. საფრეზერო დამუშავება
გამოიყენება ბრტყელი, ფასონური ზედაპირების, ღარების, ფოსოების და რთული გეომეტრიის მქონე კორპუსული დეტალების დასამუშავებლად.
პრინციპი: მთავარ მოძრაობას ასრულებს მრავალსაჭრელიანი ბრუნვადი ინსტრუმენტი - ფრეზი. ნამზადი, სამუშაო მაგიდაზე დამაგრებული, გადაადგილდება ხელის ან მექანიზმის მეშვეობით, და აუცილებელ კონტურს ქმნის.
ბრტყელი ზედაპირების შექმნა, ღარების და ჯიბეების არჩევა, რაფების დამუშავება. ეფექტურია იმ დეტალების ფორმირებისა და დაჭრისთვის, რომლებიც არ არიან ბრუნვის სხეულები.-
მიაქციეთ ყურადღება: უახლოვეს მომავალში ჩვენს არსენალში ხელმისაწვდომი იქნება მაღალი სიზუსტის მქონე დამუშავება ხუთღერძიან რპმ-დაზგაზე, მაგრამ ამჟამად ეს სერვისი ჯერ არ გვაქვს მისაწოდებლად.`,

      "S10_T": "რპმ-ფრეზირება",
      "S10_D": `ფრეზირება რპბ-დაზგებზე (CNC Router) - მექანიკური დამუშვების მაღალ ეფექტური მეთოდი, რომელიც ეფუძნება ბრუნვადი ფრეზის მეშვეობით მასალის მოშორებას. ტექნოლოგია საშუალებაას იძლევა შევასრულოთ როგორც ელემენტების ზუსტი ფრეზირება, ასევე დიდფორმატიანი ფურცლოვანი მასალების ჩქაროსნული ჭრა, რაც წმინდა ჭრის და მაღალი გამეორების საშუალებას იძლევა.
ტექნოლოგიური რეჟიმები:
2D-ფრეზირება: გამოიყენება ბრტყელი მონიშვნა-მოჭრისთვის, კონტურების ამოჭრისთვის, ღარების, ნახვრეტების და გრავირების ერთ სიბრტყეზე შესაქმნელად,
3D-ფრეზირება: გამოიყენება მოცულობითი ნაკეთობების დამზადებისთვის, რელიეფების შექმნისთვის სამ ღერძზე (X, Y, Z) ზუსტი სინქრონული მართვის მეშვეობით.
თანამედროვე დაზგები აღჭურვილია ინსტრუმენტის ავტომატური შეცვლის სისტემით (АТС). ეს საკვანძო თავისებურება საშუალებას აძლევს აღჭურვილობას თავად შეცვალოს ფრეზები, რომლებიც დამუშავების სხვადასხვა ეტაპზეა საჭირო (მაგალითად, შავად ჭრის და წმინდა ფრეზირებისთვის), ოპერატორის მონაწილეობის გარეშე. ეს მნიშვნელოვნად აჩქარებს სრული და მრავალოპერაციული პროექტების შესრულებას.
დასამუშავებელი მასალები:
ხის: ფანერი, მდფ, დსპ, ხის მასივი
პლასტიკი: ორგმინა (აკრილი), პვჰ, პოლიკარბონატი, პეტ.
კომპოზიტური: ალუმინის კომპოზიტური პანელები (აკპ).
რპმ-ფრეზირების ტექნოლოგია შეუცვლელია ავეჯის, გარე რეკლამის და რთული დიზაინერული ელემენტების წარმოებისთვის. `

    }
  }
};

const getLang = () => {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('lang');
  if (p && ['ru','en','ka'].includes(p)) return p;
  const primary = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase();
  if (primary.startsWith('ka')) return 'ka';
  if (primary.startsWith('ru')) return 'ru';
  if (primary.startsWith('en')) return 'en';
  return 'en';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getLang(),
  fallbackLng: "ru",
  interpolation: { escapeValue: false }
});

export default i18n;
