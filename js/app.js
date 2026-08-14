(() => {
  'use strict';

  const navData = Array.isArray(window.DOCS_NAV) ? window.DOCS_NAV : [];
  const defaultDoc = String(window.DEFAULT_DOC || '').trim();

  const docsNav = document.getElementById('docs-nav');
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  const pageMask = document.getElementById('page-mask');

  const docStatus = document.getElementById('doc-status');
  const docBody = document.getElementById('doc-body');

  const tocList = document.getElementById('toc-list');
  const tocToggle = document.getElementById('toc-toggle');
  const mobileTocPanel = document.getElementById('mobile-toc-panel');
  const mobileTocList = document.getElementById('mobile-toc-list');
  const tocClose = document.getElementById('toc-close');

  let activePage = '';
  let activeRequest = null;
  let tocObserver = null;

  function getAllDocs() {
    const docs = [];

    navData.forEach((group, groupIndex) => {
      const children = Array.isArray(group?.children) ? group.children : [];
      children.forEach((item) => {
        if (!item?.page || !item?.title) return;
        docs.push({
          title: String(item.title),
          page: String(item.page),
          groupTitle: String(group.title || ''),
          groupIndex
        });
      });
    });

    return docs;
  }

  const allDocs = getAllDocs();
  const validPages = new Set(allDocs.map((item) => item.page));

  function getRequestedPage() {
    const params = new URLSearchParams(window.location.search);
    const requested = String(params.get('page') || '').trim();

    if (validPages.has(requested)) return requested;
    if (validPages.has(defaultDoc)) return defaultDoc;
    return allDocs[0]?.page || '';
  }

  function getDocInfo(page) {
    return allDocs.find((item) => item.page === page) || null;
  }

  function chevronSvg() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m8 10 4 4 4-4" />
      </svg>
    `;
  }

  function renderNav(currentPage) {
    docsNav.replaceChildren();
    const fragment = document.createDocumentFragment();

    navData.forEach((group, groupIndex) => {
      const children = Array.isArray(group?.children) ? group.children : [];
      if (!group?.title || !children.length) return;

      const containsActive = children.some((item) => String(item.page) === currentPage);

      const section = document.createElement('section');
      section.className = 'nav-group';
      if (containsActive) section.classList.add('is-open');

      const button = document.createElement('button');
      button.className = 'nav-group-title';
      button.type = 'button';
      button.dataset.groupIndex = String(groupIndex);
      button.setAttribute('aria-expanded', String(containsActive));
      button.innerHTML = `<span>${escapeHtml(String(group.title))}</span>${chevronSvg()}`;

      const list = document.createElement('div');
      list.className = 'nav-children';

      children.forEach((item) => {
        if (!item?.title || !item?.page) return;

        const page = String(item.page);
        const link = document.createElement('a');
        link.className = 'nav-link';
        link.href = `?page=${encodeURIComponent(page)}`;
        link.dataset.page = page;
        link.textContent = String(item.title);

        if (page === currentPage) {
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'page');
        }

        list.appendChild(link);
      });

      section.append(button, list);
      fragment.appendChild(section);
    });

    docsNav.appendChild(fragment);
  }

  function setNavActive(page) {
    docsNav.querySelectorAll('.nav-link').forEach((link) => {
      const isActive = link.dataset.page === page;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    docsNav.querySelectorAll('.nav-group').forEach((group) => {
      const containsActive = Boolean(group.querySelector(`.nav-link[data-page="${cssEscape(page)}"]`));
      const title = group.querySelector('.nav-group-title');
      if (!containsActive || group.classList.contains('is-open')) return;

      docsNav.querySelectorAll('.nav-group.is-open').forEach((openGroup) => {
        if (openGroup === group) return;
        openGroup.classList.remove('is-open');
        openGroup.querySelector('.nav-group-title')?.setAttribute('aria-expanded', 'false');
      });

      group.classList.add('is-open');
      title?.setAttribute('aria-expanded', 'true');
    });
  }

  function toggleNavGroup(button) {
    const group = button.closest('.nav-group');
    if (!group) return;

    const nextOpen = !group.classList.contains('is-open');

    docsNav.querySelectorAll('.nav-group.is-open').forEach((openGroup) => {
      if (openGroup === group) return;
      openGroup.classList.remove('is-open');
      openGroup.querySelector('.nav-group-title')?.setAttribute('aria-expanded', 'false');
    });

    group.classList.toggle('is-open', nextOpen);
    button.setAttribute('aria-expanded', String(nextOpen));
  }

  function setStatus(message = '', type = '') {
    docStatus.textContent = message;
    docStatus.className = 'doc-status';

    if (message) docStatus.classList.add('is-visible');
    if (type === 'error') docStatus.classList.add('is-error');
  }

  function markdownToHtml(markdown) {
    if (!window.marked || typeof window.marked.parse !== 'function') {
      throw new Error('Markdown 渲染器未加载，请检查 js/marked.umd.js。');
    }

    if (typeof window.marked.setOptions === 'function') {
      window.marked.setOptions({
        gfm: true,
        breaks: false
      });
    }

    const cleanMarkdown = String(markdown).replace(
      /^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,
      ''
    );

    return window.marked.parse(cleanMarkdown);
  }

  function slugify(text, index) {
    const base = String(text)
      .trim()
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/[^\w\-\u4e00-\u9fff]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return base || `section-${index + 1}`;
  }

  function makeUniqueHeadingIds(root) {
    const used = new Set();
    const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headings.forEach((heading, index) => {
      let id = heading.id || slugify(heading.textContent, index);
      let candidate = id;
      let counter = 2;

      while (
        used.has(candidate) ||
        (document.getElementById(candidate) && document.getElementById(candidate) !== heading)
      ) {
        candidate = `${id}-${counter}`;
        counter += 1;
      }

      heading.id = candidate;
      used.add(candidate);
    });
  }

  function enhanceMarkdown(root) {
    root.querySelectorAll('table').forEach((table) => {
      if (table.parentElement?.classList.contains('table-scroll')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    root.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;

      if (href.startsWith('#')) {
        link.addEventListener('click', (event) => {
          const target = document.querySelector(href);
          if (!target) return;
          event.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return;
      }

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
      } catch {
        // 非标准链接保持原始结果。
      }
    });

    root.querySelectorAll('img').forEach((image) => {
      image.loading = 'lazy';
      image.decoding = 'async';
    });

    root.querySelectorAll('iframe').forEach((frame) => {
      frame.loading = 'lazy';
    });

    makeUniqueHeadingIds(root);
  }

  function getTocHeadings() {
    const h2 = [...docBody.querySelectorAll('h2')];
    const h3 = [...docBody.querySelectorAll('h3')];

    if (h2.length) {
      return [...docBody.querySelectorAll('h2, h3')];
    }

    if (h3.length) return h3;

    const h1 = [...docBody.querySelectorAll('h1')];
    return h1.length > 1 ? h1 : [];
  }

  function createTocLink(heading) {
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.dataset.target = heading.id;
    link.className = 'toc-link';
    if (heading.tagName === 'H3') link.classList.add('toc-link--sub');
    link.textContent = heading.textContent.trim();
    return link;
  }

  function renderToc() {
    if (tocObserver) {
      tocObserver.disconnect();
      tocObserver = null;
    }

    tocList.replaceChildren();
    mobileTocList.replaceChildren();

    const headings = getTocHeadings();

    if (!headings.length) {
      const emptyDesktop = document.createElement('p');
      emptyDesktop.className = 'toc-empty';
      emptyDesktop.textContent = '本页暂无章节导航';
      tocList.appendChild(emptyDesktop);

      const emptyMobile = emptyDesktop.cloneNode(true);
      mobileTocList.appendChild(emptyMobile);
      tocToggle.disabled = true;
      return;
    }

    tocToggle.disabled = false;

    headings.forEach((heading) => {
      tocList.appendChild(createTocLink(heading));
      mobileTocList.appendChild(createTocLink(heading));
    });

    const allTocLinks = document.querySelectorAll('.toc-link[data-target]');

    function setTocActive(id) {
      allTocLinks.forEach((link) => {
        link.classList.toggle('is-active', link.dataset.target === id);
      });
    }

    const visible = new Map();
    tocObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        visible.set(entry.target.id, entry);
      });

      const active = headings
        .map((heading) => visible.get(heading.id))
        .filter((entry) => entry?.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

      if (active?.target?.id) {
        setTocActive(active.target.id);
        return;
      }

      const passed = headings.filter((heading) => heading.getBoundingClientRect().top < 150);
      if (passed.length) setTocActive(passed[passed.length - 1].id);
    }, {
      rootMargin: '-110px 0px -65% 0px',
      threshold: [0, 1]
    });

    headings.forEach((heading) => tocObserver.observe(heading));
    setTocActive(headings[0].id);
  }

  async function fetchMarkdown(page) {
    if (activeRequest) activeRequest.abort();

    const controller = new AbortController();
    activeRequest = controller;
    const url = `docs/${encodeURIComponent(page)}.md?v=${Date.now()}`;

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`文档读取失败（HTTP ${response.status}）：docs/${page}.md`);
      }

      return await response.text();
    } finally {
      if (activeRequest === controller) activeRequest = null;
    }
  }

  async function loadPage(page, options = {}) {
    const info = getDocInfo(page);
    if (!info) return;

    activePage = page;
    setNavActive(page);
    closeMobileNav();
    closeMobileToc();

    docBody.replaceChildren();
    tocList.replaceChildren();
    mobileTocList.replaceChildren();
    setStatus('正在载入文档…');

    if (options.updateHistory !== false) {
      const url = new URL(window.location.href);
      url.searchParams.set('page', page);
      url.hash = '';
      window.history.pushState({ page }, '', url);
    }

    document.title = `${info.title} · COOWIN 文档中心`;

    try {
      const markdown = await fetchMarkdown(page);
      const html = markdownToHtml(markdown);
      docBody.innerHTML = html;
      enhanceMarkdown(docBody);
      renderToc();
      setStatus('');

      if (!options.keepScroll) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;

      docBody.replaceChildren();
      renderToc();

      let message = error?.message || '文档读取失败，请稍后重试。';
      if (window.location.protocol === 'file:') {
        message += ' 当前通过 file:// 打开，浏览器通常会阻止读取 Markdown；请使用本地 HTTP 服务器或 GitHub Pages 预览。';
      }
      setStatus(message, 'error');
    }
  }

  function openMobileNav() {
    document.body.classList.add('nav-open');
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMobileNav() {
    document.body.classList.remove('nav-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  function openMobileToc() {
    if (tocToggle.disabled) return;
    closeMobileNav();
    document.body.classList.add('toc-open');
    tocToggle.setAttribute('aria-expanded', 'true');
    mobileTocPanel.setAttribute('aria-hidden', 'false');
  }

  function closeMobileToc() {
    document.body.classList.remove('toc-open');
    tocToggle.setAttribute('aria-expanded', 'false');
    mobileTocPanel.setAttribute('aria-hidden', 'true');
  }

  function escapeHtml(text) {
    return text.replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char]));
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  docsNav.addEventListener('click', (event) => {
    const titleButton = event.target.closest('.nav-group-title');
    if (titleButton) {
      toggleNavGroup(titleButton);
      return;
    }

    const link = event.target.closest('.nav-link');
    if (!link) return;

    const page = link.dataset.page;
    if (!validPages.has(page)) return;

    event.preventDefault();
    if (page === activePage) {
      closeMobileNav();
      return;
    }

    loadPage(page);
  });

  function handleTocClick(event) {
    const link = event.target.closest('.toc-link');
    if (!link) return;

    const id = link.dataset.target;
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    event.preventDefault();
    closeMobileToc();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(window.history.state, '', `?page=${encodeURIComponent(activePage)}#${encodeURIComponent(id)}`);
  }

  tocList.addEventListener('click', handleTocClick);
  mobileTocList.addEventListener('click', handleTocClick);

  menuToggle.addEventListener('click', () => {
    if (document.body.classList.contains('nav-open')) closeMobileNav();
    else {
      closeMobileToc();
      openMobileNav();
    }
  });

  tocToggle.addEventListener('click', () => {
    if (document.body.classList.contains('toc-open')) closeMobileToc();
    else openMobileToc();
  });

  tocClose.addEventListener('click', closeMobileToc);
  pageMask.addEventListener('click', () => {
    closeMobileNav();
    closeMobileToc();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeMobileNav();
    closeMobileToc();
  });

  window.addEventListener('popstate', () => {
    const page = getRequestedPage();
    if (page && page !== activePage) {
      loadPage(page, { updateHistory: false });
    }
  });

  const initialPage = getRequestedPage();
  renderNav(initialPage);
  loadPage(initialPage, { updateHistory: false });
})();
