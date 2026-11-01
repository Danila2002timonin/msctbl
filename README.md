# Как опубликовать Mosaic Studio на GitHub Pages

Подготовлено 1 ноября 2026 года. В пакете — текущая модель каркаса **766 × 503 × 415 мм**, внутренний шов **2,1 мм**, раскрой **26 сеток**.

## 1. Распаковать файлы

Распакуй `mosaic-table-github-pages.zip` в отдельную папку. Внутри сразу должны находиться:

```text
index.html
style.css
app.js
core.js
geometry.js
measured-geometry.js
measured-packing.js
measured-plywood.js
measured-report.js
.nojekyll
README.md
vendor/
  three.module.js
  OrbitControls.js
  LICENSE-three.txt
```

Это готовый статический сайт. Устанавливать Node.js, запускать npm или настраивать сборку на GitHub не нужно. Распакованная копия также доступна в папке `github-pages-mosaic` рядом с архивом.

## 2. Создать репозиторий

На GitHub выбери **New repository**. Назови репозиторий, например, `mosaic-table`, выбери **Public**, включи **Add README** и нажми **Create repository**. Public подходит для GitHub Pages на бесплатном тарифе. [Официальная инструкция GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## 3. Загрузить содержимое папки

В репозитории открой **Code → Add file → Upload files**. Перетащи **содержимое распакованной папки**, включая каталог `vendor`. Сохрани изменения в ветку `main` кнопкой **Commit changes**; если GitHub предложит новую ветку, заверши её слияние в `main`. [Загрузка файлов через браузер](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

Загружается не ZIP и не внешняя папка `github-pages-mosaic`, а файлы из неё. После загрузки `index.html` и папка `vendor` должны лежать непосредственно в корне репозитория. `README.md` из пакета может заменить созданный при инициализации README.

Проверь, что `.nojekyll` тоже попал в репозиторий. Этот пустой файл отключает обработку Jekyll. Если его нет, выбери **Add file → Create new file**, задай имя `.nojekyll`, введи строку `static` и сохрани файл в `main`: для отключения достаточно наличия файла. [О создании статического сайта](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## 4. Включить Pages

Открой **Settings → Pages** и в разделе **Build and deployment** установи:

| Поле | Значение |
|---|---|
| Source | **Deploy from a branch** |
| Branch | **main** |
| Folder | **/ (root)** |

Нажми **Save**. Для этого пакета отдельный workflow создавать не требуется. [Настройка источника публикации](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## 5. Открыть сайт

Дождись завершения публикации во вкладке **Actions**, затем открой **Settings → Pages → Visit site**. Для репозитория `mosaic-table` адрес будет таким:

```text
https://ТВОЙ_ЛОГИН.github.io/mosaic-table/
```

Публикация изменений может занять до 10 минут. Если репозиторий называется `ТВОЙ_ЛОГИН.github.io`, сайт будет в корне этого домена. [Просмотр опубликованного сайта](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

Проверь: видна 3D-модель, размеры каркаса 766 × 503 × 415 мм, работают слои, разделы фанеры/мозаики и скачивание расчёта. Все пути в пакете относительные, поэтому переименование репозитория не требует правки кода.

## Обновление сайта

После правок подготовь новый пакет, загрузи изменённые файлы с сохранением структуры и сохрани их в `main`. Pages опубликует изменения автоматически. `vendor` и `.nojekyll` должны оставаться на месте. [Публикация из ветки](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Сохранённые варианты на `localhost` автоматически на новый адрес не переносятся: приложение использует хранилище браузера, отдельное для каждого origin. Базовая рассчитанная модель уже включена в пакет; пользовательские варианты на опубликованном сайте сохраняются в браузере посетителя.

## Если что-то не работает

- **404 вместо сайта:** проверь `main`, `/ (root)`, наличие `index.html` в корне и статус публикации в Actions.
- **Страница есть, но нет модели:** проверь, что загружены все JS-файлы и `vendor` целиком. Сохрани регистр букв в именах. Для 3D браузеру нужен WebGL.
- **Отображается старый вариант:** дождись новой публикации и обнови страницу сочетанием Ctrl+F5.
- **Нет папки vendor после загрузки:** перетащи сам каталог `vendor` в форму Upload files, сохраняя вложенность. Файлы библиотеки не должны лежать рядом с `index.html`.

## Повторная подготовка пакета из локального проекта

Из папки `mosaic-studio` выполни:

```powershell
node prepare-github-pages.mjs
```

Скрипт обновит папку `github-pages-mosaic`. В публикационной копии модули имеют расширение `.js`; исходный локальный проект с `.mjs` остаётся на месте. Архив подготовленной версии прилагается отдельно. Проверки расчёта запускаются командой `node tests.mjs` в исходном проекте.
