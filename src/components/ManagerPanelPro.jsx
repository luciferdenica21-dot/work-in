import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { removeToken } from '../config/api';
import { chatsAPI, messagesAPI, ordersAPI, filesAPI, authAPI, analyticsAPI, backupsAPI, signaturesAPI } from '../config/api';
import SignatureRequestComposer from './SignatureRequestComposer';
import { initSocket, getSocket, disconnectSocket } from '../config/socket';
import { useAvatarUrl } from '../hooks/useAvatarUrl';
import {
  LogOut, Send, ChevronLeft, User, Mail, Phone, MapPin, Edit, Save, X,
  Plus, Trash2, FileText, Info, Settings, MessageSquare, MessageCircle,
  CheckCircle, XCircle, Download, Paperclip, Bell, Search, Filter, Clock,
  BookOpen, Users, Home, Package, Code, Shield, Database, Menu,
  Eye, EyeOff, Upload, RefreshCw, AlertCircle, TrendingUp, Activity, Calendar, ChevronDown, Pin, CheckSquare, Square, Reply
} from 'lucide-react';

const UserAvatar = ({ email, name, size = "w-10 h-10", showStatus = false, isOnline = false, className = "" }) => {
  const url = useAvatarUrl(email);
  const label = String(name || '').trim() || String(email || '').trim() || '?';
  const initial = (label[0] || '?').toUpperCase();
  return (
    <div className={`relative shrink-0 ${size} ${className}`}>
      <div className="relative w-full h-full rounded-full overflow-hidden border border-white/10 bg-white/5">
        <div className="absolute inset-0 flex items-center justify-center text-white/50 text-[10px] font-bold uppercase">
          {initial}
        </div>
        {url ? (
          <img
            src={url}
            alt="avatar"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : null}
      </div>
      {showStatus && (
        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#050a18] ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
      )}
    </div>
  );
};

function ManagerPanelPro({ user }) {
  const { t, i18n } = useTranslation();
  const adminAvatarUrl = useAvatarUrl(user?.email);
  
  // Функция форматирования размера файла
  const formatFileSize = (bytes) => {
    if (!bytes) return '未知大小';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

const getAbsoluteFileUrl = (fileUrl) => {
    if (!fileUrl) return '';
    return filesAPI.getFileUrl(fileUrl);
  };

  const escapeCsvValue = (value) => {
    const s = value == null ? '' : String(value);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const downloadTextFile = (filename, content, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const escapeHtml = (value) => {
    const s = value == null ? '' : String(value);
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const buildOrderPdfHtml = (ordersList) => {
    const list = Array.isArray(ordersList) ? ordersList : [];
    const safeList = list.map(formatOrderForExport);

    const blocks = safeList.map((o) => {
      const client = [o.firstName, o.lastName].filter(Boolean).join(' ');
      const services = (o.services || []).join(', ');
      const prices = [
        o.priceGel ? `₾ ${o.priceGel}` : null,
        o.priceUsd ? `$ ${o.priceUsd}` : null,
        o.priceEur ? `€ ${o.priceEur}` : null
      ].filter(Boolean).join(' / ');
      const fileBlocks = (o.files || []).map((f) => {
        const url = f?.url;
        const name = f?.name || 'file';
        const type = f?.type || '';
        if (!url) return '';

        const isImage = (typeof type === 'string' && type.startsWith('image/')) ||
          /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);

        if (isImage) {
          return `
            <div class="photo">
              <div class="photo-name">${escapeHtml(name)}</div>
              <img class="photo-img" src="${escapeHtml(url)}" alt="${escapeHtml(name)}" />
            </div>
          `;
        }

        return `
          <div class="file-row">
            <span class="k">Файл:</span>
            <span class="v">${escapeHtml(name)}</span>
          </div>
        `;
      }).filter(Boolean).join('');

      return `
        <div class="order">
          <div class="row"><span class="k">Статус:</span><span class="v">${escapeHtml(o.status || '')}</span></div>
          <div class="row"><span class="k">Chat:</span><span class="v">${escapeHtml(o.chatId || '')}</span></div>
          <div class="row"><span class="k">№:</span><span class="v">${escapeHtml(o.orderIndex ?? '')}</span></div>
          <div class="row"><span class="k">Клиент:</span><span class="v">${escapeHtml(client)}</span></div>
          <div class="row"><span class="k">Контакт:</span><span class="v">${escapeHtml(o.contact || '')}</span></div>
          <div class="row"><span class="k">Телефон:</span><span class="v">${escapeHtml(o.phone || '')}</span></div>
          <div class="row"><span class="k">Город:</span><span class="v">${escapeHtml(o.city || '')}</span></div>
          <div class="row"><span class="k">Услуги:</span><span class="v">${escapeHtml(services || '')}</span></div>
          ${o.managerDate ? `<div class="row"><span class="k">Дата менеджера:</span><span class="v">${escapeHtml(new Date(o.managerDate).toLocaleDateString())}</span></div>` : ''}
          ${prices ? `<div class="row"><span class="k">Цена:</span><span class="v">${escapeHtml(prices)}</span></div>` : ''}
          ${o.managerComment ? `<div class="row"><span class="k">Примечание менеджера:</span><span class="v">${escapeHtml(o.managerComment)}</span></div>` : ''}
          ${o.comment ? `<div class="row"><span class="k">Комментарий:</span><span class="v">${escapeHtml(o.comment)}</span></div>` : ''}
          ${fileBlocks ? `<div class="photos">${fileBlocks}</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Orders Export</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 0; color: #111; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .wrap { padding: 14px; }
            h1 { margin: 0 0 8px 0; font-size: 16px; }
            .meta { margin-bottom: 10px; font-size: 11px; color: #555; }
            .orders { display: flex; flex-direction: column; gap: 16px; }

            .order { page-break-inside: avoid; }
            .row { margin: 2px 0; font-size: 12px; line-height: 1.4; }
            .k { font-weight: 700; margin-right: 6px; }
            .v { font-weight: 400; }
            .photos { margin-top: 10px; display: flex; flex-direction: column; gap: 10px; }
            .photo-name { font-size: 11px; color: #444; margin-bottom: 6px; word-break: break-word; }
            .photo-img { width: 100%; max-width: 680px; height: auto; border-radius: 10px; display: block; }
            .file-row { margin-top: 6px; font-size: 11px; color: #444; }
            @media print { .wrap { padding: 10mm; } }
          </style>
        </head>
        <body>
          <div class="wrap">
            <h1>Заказ</h1>
            <div class="meta">Сформировано: ${escapeHtml(new Date().toLocaleString())}</div>
            <div class="orders">${blocks}</div>
          </div>
        </body>
      </html>
    `;
  };

  const downloadOrdersPdf = (ordersList) => {
    const html = buildOrderPdfHtml(ordersList);
    const w = window.open('', '_blank');
    if (!w) {
      alert('Разрешите открытие всплывающих окон для скачивания PDF');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
    }, 300);
  };

  const formatOrderForExport = (order) => {
    const safe = order || {};
    return {
      chatId: safe.chatId,
      orderIndex: safe.orderIndex,
      status: safe.status,
      createdAt: safe.createdAt,
      firstName: safe.firstName,
      lastName: safe.lastName,
      contact: safe.contact,
      phone: safe.phone,
      city: safe.city,
      services: safe.services || [],
      managerDate: safe.managerDate || null,
      priceGel: safe.priceGel ?? 0,
      priceUsd: safe.priceUsd ?? 0,
      priceEur: safe.priceEur ?? 0,
      managerComment: safe.managerComment || '',
      comment: safe.comment || safe.comments || safe.note || safe.message || '',
      files: (safe.files || []).map((f) => ({
        id: f?.id,
        name: f?.name,
        type: f?.type,
        size: f?.size,
        url: getAbsoluteFileUrl(f?.url),
      })),
    };
  };

  const downloadOrder = (order, format) => {
    const safe = formatOrderForExport(order);
    const baseName = `order_${safe.chatId || 'chat'}_${safe.orderIndex ?? 'idx'}`;

    if (format === 'json') {
      downloadTextFile(`${baseName}.json`, JSON.stringify(safe, null, 2), 'application/json;charset=utf-8');
      return;
    }

    if (format === 'txt') {
      const lines = [
        `Chat ID: ${safe.chatId || ''}`,
        `Order Index: ${safe.orderIndex ?? ''}`,
        `Status: ${safe.status || ''}`,
        `Created: ${safe.createdAt || ''}`,
        `Client: ${[safe.firstName, safe.lastName].filter(Boolean).join(' ')}`,
        `Contact: ${safe.contact || ''}`,
        `Phone: ${safe.phone || ''}`,
        `City: ${safe.city || ''}`,
        `Services: ${(safe.services || []).join(', ')}`,
        `Manager Date: ${safe.managerDate ? new Date(safe.managerDate).toLocaleDateString() : ''}`,
        `Manager Prices: ${[safe.priceGel ? `₾ ${safe.priceGel}` : null, safe.priceUsd ? `$ ${safe.priceUsd}` : null, safe.priceEur ? `€ ${safe.priceEur}` : null].filter(Boolean).join(' / ')}`,
        `Manager Note: ${safe.managerComment || ''}`,
        `Comment: ${safe.comment || ''}`,
        `Files:`,
        ...(safe.files || []).map((f) => `- ${f.name || ''} (${f.type || ''}, ${f.size || ''}) ${f.url || ''}`),
      ];
      downloadTextFile(`${baseName}.txt`, lines.join('\n'));
      return;
    }

    if (format === 'csv') {
      const row = {
        chatId: safe.chatId,
        orderIndex: safe.orderIndex,
        status: safe.status,
        createdAt: safe.createdAt,
        firstName: safe.firstName,
        lastName: safe.lastName,
        contact: safe.contact,
        phone: safe.phone,
        city: safe.city,
        services: (safe.services || []).join('|'),
        managerDate: safe.managerDate || '',
        priceGel: safe.priceGel ?? 0,
        priceUsd: safe.priceUsd ?? 0,
        priceEur: safe.priceEur ?? 0,
        managerComment: safe.managerComment || '',
        comment: safe.comment,
        files: (safe.files || []).map((f) => f.url).filter(Boolean).join('|'),
      };
      const headers = Object.keys(row);
      const csv = [
        headers.join(','),
        headers.map((h) => escapeCsvValue(row[h])).join(','),
      ].join('\n');
      downloadTextFile(`${baseName}.csv`, csv, 'text/csv;charset=utf-8');
    }
  };

  const downloadOrdersList = (ordersList, format) => {
    const list = Array.isArray(ordersList) ? ordersList : [];
    const safeList = list.map(formatOrderForExport);
    const baseName = `orders_export_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      downloadTextFile(`${baseName}.json`, JSON.stringify(safeList, null, 2), 'application/json;charset=utf-8');
      return;
    }

    if (format === 'txt') {
      const txt = safeList.map((o) => {
        const client = [o.firstName, o.lastName].filter(Boolean).join(' ');
        const prices = [
          o.priceGel ? `₾ ${o.priceGel}` : null,
          o.priceUsd ? `$ ${o.priceUsd}` : null,
          o.priceEur ? `€ ${o.priceEur}` : null
        ].filter(Boolean).join(' / ');
        return [
          `# ${o.chatId || ''} / ${o.orderIndex ?? ''}`,
          `Status: ${o.status || ''}`,
          `Client: ${client}`,
          `Contact: ${o.contact || ''}`,
          `Services: ${(o.services || []).join(', ')}`,
          `Manager Date: ${o.managerDate ? new Date(o.managerDate).toLocaleDateString() : ''}`,
          `Manager Prices: ${prices}`,
          `Manager Note: ${o.managerComment || ''}`,
          `Files: ${(o.files || []).map((f) => f.url).filter(Boolean).join(', ')}`,
        ].join('\n');
      }).join('\n\n');
      downloadTextFile(`${baseName}.txt`, txt);
      return;
    }

    if (format === 'csv') {
      const headers = [
        'chatId','orderIndex','status','createdAt','firstName','lastName','contact','phone','city','services','managerDate','priceGel','priceUsd','priceEur','managerComment','comment','files'
      ];
      const rows = safeList.map((o) => {
        const row = {
          chatId: o.chatId,
          orderIndex: o.orderIndex,
          status: o.status,
          createdAt: o.createdAt,
          firstName: o.firstName,
          lastName: o.lastName,
          contact: o.contact,
          phone: o.phone,
          city: o.city,
          services: (o.services || []).join('|'),
          managerDate: o.managerDate || '',
          priceGel: o.priceGel ?? 0,
          priceUsd: o.priceUsd ?? 0,
          priceEur: o.priceEur ?? 0,
          managerComment: o.managerComment || '',
          comment: o.comment,
          files: (o.files || []).map((f) => f.url).filter(Boolean).join('|'),
        };
        return headers.map((h) => escapeCsvValue(row[h])).join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      downloadTextFile(`${baseName}.csv`, csv, 'text/csv;charset=utf-8');
    }
  };

  // ===== РЕЗЕРВНОЕ КОПИРОВАНИЕ ЧАТОВ И ЗАКАЗОВ =====

  const buildBackupSnapshot = async () => {
    const snapshot = {
      createdAt: new Date().toISOString(),
      users: [],
      totals: { chats: 0, messages: 0, orders: 0 }
    };
    try {
      const chatList = Array.isArray(chats) ? chats : [];
      const ordersList = await ordersAPI.getAll().catch(() => []);
      snapshot.totals.chats = chatList.length;
      const perChat = await Promise.all(
        chatList.map(async (c) => {
          const msgs = await messagesAPI.getByChatId(c.chatId).catch(() => []);
          const userOrders = (ordersList || []).filter(o => String(o.chatId) === String(c.chatId));
          snapshot.totals.messages += msgs.length;
          snapshot.totals.orders += userOrders.length;
          return {
            chatId: c.chatId,
            userEmail: c.userEmail || '',
            messages: msgs.map(m => ({
              id: m._id || m.id || '',
              at: m.createdAt || '',
              from: m.senderId || m.senderRole || '',
              text: m.text || '',
              attachments: (m.attachments || []).map(a => ({
                originalName: a.originalName || a.filename || '',
                mimetype: a.mimetype || '',
                size: a.size || 0,
                url: a.url || ''
              }))
            })),
            orders: userOrders.map(o => ({
              orderIndex: o.orderIndex,
              status: o.status,
              createdAt: o.createdAt || '',
              firstName: o.firstName || '',
              lastName: o.lastName || '',
              contact: o.contact || '',
              services: Array.isArray(o.services) ? o.services : [],
              comment: o.comment || '',
              files: Array.isArray(o.files) ? o.files.map(f => ({
                name: f.name || '',
                type: f.type || '',
                size: f.size || 0,
                url: f.url || ''
              })) : [],
              priceGel: o.priceGel ?? 0,
              priceUsd: o.priceUsd ?? 0,
              priceEur: o.priceEur ?? 0,
              managerComment: o.managerComment || '',
              managerDate: o.managerDate || ''
            }))
          };
        })
      );
      snapshot.users = perChat;
    } catch (err) {
      console.error('Backup build error:', err);
    }
    return snapshot;
  };

  const handleMakeBackup = async () => {
    const snapshot = await buildBackupSnapshot();
    try {
      localStorage.setItem('manager_backup_last', JSON.stringify(snapshot));
    } catch { void 0; }
    try {
      await backupsAPI.create(snapshot);
      alert('Резервная копия сохранена в базе');
    } catch {
      alert('Не удалось сохранить в базе, сохранено локально');
    }
  };

  const buildBackupPrintableHtml = (snapshot) => {
    const head = `
      <!doctype html>
      <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Резервная копия</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", "Segoe UI Emoji", "Apple Color Emoji", "Segoe UI Symbol"; color: #111; background: #fff; }
          .wrap { padding: 16px; }
          h1 { margin: 0 0 8px 0; font-size: 18px; }
          .meta { font-size: 12px; color: #555; margin-bottom: 14px; }
          .user { page-break-inside: avoid; margin-bottom: 16px; }
          .user h2 { margin: 0 0 6px 0; font-size: 15px; }
          .block-title { font-size: 13px; font-weight: 600; margin: 8px 0 6px 0; }
          .msg, .order { font-size: 12px; line-height: 1.45; margin: 4px 0; white-space: pre-wrap; word-break: break-word; }
          .msg .t { color: #555; margin-right: 6px; }
          .msg .w { font-weight: 600; margin-right: 6px; }
          .att { font-size: 11px; color: #444; margin-left: 14px; }
          .divider { margin: 14px 0; height: 1px; background: #eee; }
          @media print { .wrap { padding: 10mm; } }
        </style>
      </head>
      <body><div class="wrap">
    `;
    const intro = `
      <h1>Отчёт: резервная копия данных</h1>
      <div class="meta">Дата: ${escapeHtml(new Date(snapshot.createdAt).toLocaleString())}</div>
      <div class="meta">Всего чатов: ${escapeHtml(String(snapshot.totals.chats))}, сообщений: ${escapeHtml(String(snapshot.totals.messages))}, заказов: ${escapeHtml(String(snapshot.totals.orders))}</div>
      <div class="divider"></div>
    `;
    const usersHtml = (snapshot.users || [])
      .map((u) => {
        const header = `<div class="user"><h2>Пользователь: ${escapeHtml(u.userEmail || '')} (chatId: ${escapeHtml(String(u.chatId || ''))})</h2>`;
        const msgsTitle = `<div class="block-title">Сообщения: ${escapeHtml(String((u.messages || []).length))}</div>`;
        const msgs = (u.messages || [])
          .map((m) => {
            const t = m.at ? new Date(m.at).toLocaleString() : '';
            const who = m.from === 'manager' ? 'Менеджер' : 'Клиент';
            const text = escapeHtml(m.text || '');
      const atts = (m.attachments || []).map((a) => `• ${escapeHtml(a.originalName || '')} (${escapeHtml(a.mimetype || '')}, ${escapeHtml(formatFileSize(a.size || 0))})`).join('<br/>');
            const attBlock = atts ? `<div class="att">${atts}</div>` : '';
            return `<div class="msg"><span class="t">[${escapeHtml(t)}]</span><span class="w">${escapeHtml(who)}:</span>${text}${attBlock}</div>`;
          })
          .join('');
        const ordersTitle = `<div class="block-title">Заказы: ${escapeHtml(String((u.orders || []).length))}</div>`;
        const orders = (u.orders || [])
          .map((o) => {
            const created = o.createdAt ? new Date(o.createdAt).toLocaleString() : '';
            const client = [o.firstName, o.lastName].filter(Boolean).join(' ');
            const prices = `GEL ${o.priceGel ?? 0}, USD ${o.priceUsd ?? 0}, EUR ${o.priceEur ?? 0}`;
            const files = (o.files || []).map((f) => `• ${escapeHtml(f.name || '')} (${escapeHtml(f.type || '')}, ${escapeHtml(formatFileSize(f.size || 0))}) ${f.url ? `— ${escapeHtml(f.url)}` : ''}`).join('<br/>');
            const services = (o.services || []).join(', ');
            return `
              <div class="order">
                <div><strong>Заказ #${escapeHtml(String(o.orderIndex))}</strong> | Статус: ${escapeHtml(o.status || '—')} | Создан: ${escapeHtml(created)}</div>
                ${client ? `<div>Клиент: ${escapeHtml(client)}</div>` : ''}
                ${o.contact ? `<div>Контакт: ${escapeHtml(o.contact)}</div>` : ''}
                ${services ? `<div>Услуги: ${escapeHtml(services)}</div>` : ''}
                ${o.comment ? `<div>Комментарий клиента: ${escapeHtml(o.comment)}</div>` : ''}
                <div>Цена: ${escapeHtml(prices)}</div>
                ${o.managerComment ? `<div>Примечание менеджера: ${escapeHtml(o.managerComment)}</div>` : ''}
                ${o.managerDate ? `<div>Дата менеджера: ${escapeHtml(new Date(o.managerDate).toLocaleDateString())}</div>` : ''}
                ${files ? `<div class="att">${files}</div>` : ''}
              </div>
            `;
          })
          .join('');
        return `${header}${msgsTitle}${msgs}${ordersTitle}${orders}</div><div class="divider"></div>`;
      })
      .join('');
    const tail = `</div></body></html>`;
    return head + intro + usersHtml + tail;
  };

  const handleDownloadBackup = async () => {
    let snapshot = null;
    try {
      snapshot = await backupsAPI.latest();
    } catch { void 0; }
    if (!snapshot) {
      let raw = null;
      try { raw = localStorage.getItem('manager_backup_last'); } catch { void 0; }
      if (raw) {
        try { snapshot = JSON.parse(raw); } catch { void 0; }
      }
    }
    if (!snapshot) {
      alert('Резервная копия не найдена. Сначала выполните резервное копирование.');
      return;
    }
    const html = buildBackupPrintableHtml(snapshot);
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (w && w.document) {
      w.document.open('text/html', 'replace');
      w.document.write(html);
      w.document.close();
      setTimeout(() => {
        try { w.print(); } catch { /* ignore */ }
      }, 300);
    } else {
      const name = `backup_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.html`;
      downloadTextFile(name, html, 'text/html;charset=utf-8');
    }
  };

  const SIGNATURE_MARKER = '__SIGNREQ__:';
  const isSignatureScript = (script) => typeof script?.text === 'string' && script.text.startsWith(SIGNATURE_MARKER);
  const parseSignatureScript = (script) => {
    try {
      const raw = script.text.slice(SIGNATURE_MARKER.length);
      const obj = JSON.parse(raw);
      if (obj?.file?.url) {
        return {
          file: obj.file,
          managerSignatureDataUrl: obj.managerSignatureDataUrl || null,
          managerSignPos: obj.managerSignPos || null
        };
      }
    } catch { /* ignore */ }
    return null;
  };
  // отправка шаблона подписи осуществляется только через чат

  const renderOrderFile = (file) => {
    const url = getAbsoluteFileUrl(file?.url);
    if (!url) return null;

    if (file.type?.startsWith('image/')) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={url}
            alt={file.name}
            className="w-full h-28 object-cover rounded-lg border border-white/10 hover:opacity-90 transition-opacity"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </a>
      );
    }

    if (file.type?.startsWith('video/')) {
      return (
        <video
          src={url}
          controls
          className="w-full h-36 rounded-lg border border-white/10"
        />
      );
    }

    if (file.type?.startsWith('audio/')) {
      return (
        <audio
          src={url}
          controls
          className="w-full"
        />
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 underline text-xs"
      >
        <FileText className="w-4 h-4" />
        <span className="truncate">{file.name}</span>
      </a>
    );
  };
  const [chats, setChats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientsSelectedClient, setClientsSelectedClient] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [selectedOrdersUserKey, setSelectedOrdersUserKey] = useState(null);
  const [mobileOrdersListOpen, setMobileOrdersListOpen] = useState(true);
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [activeSection, setActiveSection] = useState('dashboard'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileChatListOpen, setMobileChatListOpen] = useState(true);
  const [chatActionsOpen, setChatActionsOpen] = useState(false);
  const [systemOverviewOpen, setSystemOverviewOpen] = useState(true);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [contextMenuMsg, setContextMenuMsg] = useState(null);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [replyToMsg, setReplyToMsg] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pinnedOrder, setPinnedOrder] = useState(null);
  const [seenOrders, setSeenOrders] = useState(() => {
    try {
      const raw = localStorage.getItem('manager_seen_orders');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [orderDetailsDraft, setOrderDetailsDraft] = useState({});
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [showInstallModal, setShowInstallModal] = useState(false);
  const installPromptHandlerRef = useRef(null);

  useEffect(() => {
    try {
      if (activeSection === 'chats' && activeId) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch { void 0; }
  }, [messages.length, activeId, activeSection]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (activeSection !== 'chats' || !activeId) return;
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { chatId: activeId, isTyping: !!inputText });
    typingTimeoutRef.current = setTimeout(() => {
      try { socket.emit('typing', { chatId: activeId, isTyping: false }); } catch { void 0; }
    }, 1200);
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [inputText, activeId, activeSection]);
  
  // Управление сайтом
  const [siteContent, setSiteContent] = useState({
    heroTitle: 'PROMYSHLENNOE KACHESTVO DLYA VASHIH ZADACH',
    heroDescription: 'Need unique parts, interior accessories, or custom products for your business?',
    metaTitle: 'CONNECTOR - Промышленное качество',
    metaDescription: 'Уникальные детали и кастомные изделия для вашего бизнеса'
  });

  const [services, setServices] = useState([
    { id: 'S1_T', name: '3D печать', description: 'Высокоточная 3D печать', active: true },
    { id: 'S2_T', name: 'Лазерная резка', description: 'Прецизионная лазерная резка', active: true },
    { id: 'S3_T', name: 'Фрезеровка', description: 'CNC фрезеровка материалов', active: true }
  ]);

  const [scripts, setScripts] = useState(() => {
    const saved = localStorage.getItem('manager_scripts');
    if (!saved) {
      return [
        { id: 1, title: 'Приветствие', text: 'Здравствуйте! Чем я могу вам помочь?', files: [] },
        { id: 2, title: 'Оплата', text: 'Реквизиты для оплаты отправлены вам на почту.', files: [] }
      ];
    }

    try {
      const parsed = JSON.parse(saved);
      const base = Array.isArray(parsed) ? parsed : [
        { id: 1, title: 'Приветствие', text: 'Здравствуйте! Чем я могу вам помочь?', files: [] },
        { id: 2, title: 'Оплата', text: 'Реквизиты для оплаты отправлены вам на почту.', files: [] }
      ];
      return base.map((s) => ({ ...s, files: Array.isArray(s.files) ? s.files : [] }));
    } catch {
      return [
      { id: 1, title: 'Приветствие', text: 'Здравствуйте! Чем я могу вам помочь?', files: [] },
      { id: 2, title: 'Оплата', text: 'Реквизиты для оплаты отправлены вам на почту.', files: [] }
      ];
    }
  });

  const [newScript, setNewScript] = useState({ title: '', text: '', files: [] });
  const [editingScriptId, setEditingScriptId] = useState(null);
  const [showScriptMenu, setShowScriptMenu] = useState(false);
  const [scriptSearch, setScriptSearch] = useState('');
  const [scriptEditorOpen, setScriptEditorOpen] = useState(false);
  const [scriptFilesUploading, setScriptFilesUploading] = useState(false);
  const [signatureComposerOpen, setSignatureComposerOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [orderDetailsEditorOpen, setOrderDetailsEditorOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  // removed signatures section state

  useEffect(() => {
    try {
      localStorage.setItem('manager_scripts', JSON.stringify(scripts));
    } catch {
      // ignore
    }
  }, [scripts]);

  useEffect(() => {
    try {
      const srv = Array.isArray(user?.quickScripts) ? user.quickScripts : null;
      if (srv && srv.length > 0) {
        const local = Array.isArray(scripts) ? scripts : [];
        const same =
          srv.length === local.length &&
          srv.every((s, i) => s.title === local[i]?.title && s.text === local[i]?.text && JSON.stringify(s.files || []) === JSON.stringify(local[i]?.files || []));
        if (!same) {
          setScripts(srv.map(s => ({ id: String(s.id || Date.now()), title: s.title, text: s.text, files: Array.isArray(s.files) ? s.files : [] })));
        }
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const sync = async () => {
      try {
        if (user?.role === 'admin') {
          const payload = (Array.isArray(scripts) ? scripts : []).map(s => ({
            id: String(s.id || Date.now()),
            title: String(s.title || ''),
            text: String(s.text || ''),
            files: Array.isArray(s.files) ? s.files : []
          }));
          await authAPI.updateProfile({ quickScripts: payload });
        }
      } catch { /* ignore */ }
    };
    sync();
    return () => { };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scripts]);

  const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

  const getClientChat = (clientId, email) => {
    const id = clientId != null ? String(clientId) : '';
    const emailKey = normalizeEmail(email);
    if (!id && !emailKey) return null;
    return (
      (chats || []).find((c) => {
        const byId = id && String(c?.userId) === id;
        const byEmail = emailKey && normalizeEmail(c?.userEmail) === emailKey;
        return byId || byEmail;
      }) || null
    );
  };

  const getOrderKey = (order) => {
    const chatId = order?.chatId;
    const orderIndex = order?.orderIndex;
    if (chatId == null || orderIndex == null) return '';
    return `${chatId}:${orderIndex}`;
  };

  const setOrderStatusOverride = (orderKey, status) => {
    if (!orderKey) return;
    try {
      const raw = localStorage.getItem('manager_order_status_overrides');
      const parsed = raw ? JSON.parse(raw) : {};
      const next = parsed && typeof parsed === 'object' ? { ...parsed } : {};
      next[orderKey] = status;
      localStorage.setItem('manager_order_status_overrides', JSON.stringify(next));
    } catch { void 0; }
  };

  const applyOrderStatusOverrides = (list) => {
    try {
      const raw = localStorage.getItem('manager_order_status_overrides');
      const parsed = raw ? JSON.parse(raw) : {};
      const map = parsed && typeof parsed === 'object' ? parsed : {};
      return (list || []).map((o) => {
        const key = getOrderKey(o);
        const ov = key ? map[key] : null;
        return ov ? { ...o, status: ov } : o;
      });
    } catch {
      return list || [];
    }
  };

  const markOrderSeen = (order) => {
    const key = getOrderKey(order);
    if (!key) return;
    setSeenOrders((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const getOrderDraft = (order) => {
    const key = getOrderKey(order);
    if (!key) return {};
    const existing = orderDetailsDraft[key];
    if (existing) return existing;
    return {
      managerComment: order.managerComment || '',
      priceGel: order.priceGel ?? 0,
      priceUsd: order.priceUsd ?? 0,
      priceEur: order.priceEur ?? 0,
      managerDate: order.managerDate ? new Date(order.managerDate).toISOString().slice(0, 10) : ''
    };
  };

  const setOrderDraftField = (order, field, value) => {
    const key = getOrderKey(order);
    if (!key) return;
    setOrderDetailsDraft((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || getOrderDraft(order)), [field]: value }
    }));
  };

  const handleSaveOrderDetails = async (order) => {
    try {
      const key = getOrderKey(order);
      const draft = orderDetailsDraft[key] || getOrderDraft(order);
      const payload = {
        managerComment: draft.managerComment || '',
        priceGel: Number(draft.priceGel) || 0,
        priceUsd: Number(draft.priceUsd) || 0,
        priceEur: Number(draft.priceEur) || 0,
        managerDate: draft.managerDate || null
      };
      await ordersAPI.updateDetails(order.chatId, order.orderIndex, payload);
      loadOrders();
    } catch (err) {
      console.error('Error saving order details:', err);
      alert('Ошибка сохранения данных заказа');
    }
  };

  const openChatWithOrder = (order) => {
    if (!order?.chatId) return;
    setPinnedOrder(order);
    markOrderSeen(order);
    setActiveSection('chats');
    setActiveId(order.chatId);
    setMobileChatListOpen(false);
  };

  useEffect(() => {
    try {
      localStorage.setItem('manager_seen_orders', JSON.stringify(seenOrders));
    } catch {
      // ignore
    }
  }, [seenOrders]);

  useEffect(() => {
    setOrderDetailsDraft((prev) => {
      const next = { ...prev };
      (orders || []).forEach((order) => {
        const key = getOrderKey(order);
        if (!key) return;
        if (!next[key]) {
          next[key] = {
            managerComment: order.managerComment || '',
            priceGel: order.priceGel ?? 0,
            priceUsd: order.priceUsd ?? 0,
            priceEur: order.priceEur ?? 0,
            managerDate: order.managerDate ? new Date(order.managerDate).toISOString().slice(0, 10) : ''
          };
        }
      });
      return next;
    });
  }, [orders]);


  // Навигационные пункты для админа - только основные
  const navItems = [
    { id: 'dashboard', labelKey: 'MP_DASHBOARD', icon: Home },
    { id: 'chats', labelKey: 'MP_CHATS', icon: MessageCircle },
    { id: 'orders', labelKey: 'MP_ORDERS', icon: Package },
    { id: 'clients', labelKey: 'MP_CLIENTS', icon: Users },
    { id: 'scripts', labelKey: 'MP_SCRIPTS', icon: Code },
    { id: 'stats', labelKey: 'MP_STATS', icon: Activity }
  ];


  const brandGradient = "bg-gradient-to-r from-blue-600 to-cyan-500";
  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  // Загрузка данных
  const loadChats = async () => {
    try {
      const data = await chatsAPI.getAll();
      setChats(data || []);
    } catch (error) { console.error('Error loading chats:', error); }
  };

  const loadOrders = async () => {
    try {
      const data = await ordersAPI.getAll();
      setOrders(applyOrderStatusOverrides(data || []));
    } catch (error) { 
      console.error('Error loading orders:', error);
      setOrders([]);
    }
  };

  // removed signatures section loader

  const isUserOnline = (user) => {
    const id = user?._id || user?.id;
    return id ? onlineUserIds.has(String(id)) : false;
  };

  const loadAllUsers = async () => {
    try {
      // Сначала получаем реальных пользователей с сайта
      let realUsers = [];
      try {
        const usersData = await authAPI.getUsers() || [];
        realUsers = usersData;
      } catch {
        console.log('Users API not available, using chat/order data');
      }

      const usersMap = new Map();
      const emailToId = new Map();
      (realUsers || []).forEach(u => {
        const id = u?._id || u?.id;
        const email = (u?.email || '').toLowerCase();
        if (email) emailToId.set(email, id);
      });
      
      // Добавляем реальных пользователей
      realUsers.forEach(user => {
        const uid = String(user._id || user.id || '').trim();
        if (!uid) return;
        usersMap.set(uid, {
          id: uid,
          email: user.email,
          firstName: user.firstName || user.name?.split(' ')[0] || 'User',
          lastName: user.lastName || user.name?.split(' ')[1] || '',
          phone: user.phone || '',
          city: user.city || '',
          role: user.role || 'user',
          status: user.status || 'offline',
          lastSeen: user.lastSeen || new Date(),
          createdAt: user.createdAt || new Date(),
          ordersCount: 0,
          unreadCount: 0
        });
      });
      
      // Добавляем пользователей из чатов
      chats.forEach(chat => {
        const emailKey = (chat.userEmail || '').toLowerCase();
        const rawId = chat.userId ? String(chat.userId) : '';
        const mappedId = emailToId.get(emailKey) ? String(emailToId.get(emailKey)) : '';
        const resolvedId = usersMap.has(rawId) ? rawId : (mappedId || rawId);
        if (resolvedId && !usersMap.has(resolvedId)) {
          usersMap.set(resolvedId, {
            id: resolvedId,
            email: chat.userEmail || 'unknown@example.com',
            firstName: chat.userEmail?.split('@')[0] || 'User',
            lastName: '',
            phone: '',
            city: '',
            role: 'user',
            status: chat.unread ? 'online' : 'offline',
            lastSeen: chat.lastMessageTime || new Date(),
            createdAt: new Date(),
            ordersCount: 0,
            unreadCount: chat.unread ? 1 : 0
          });
        }
      });

      // Обновляем статистику из заказов
      const chatIdToUserId = new Map((chats || []).map((c) => [String(c?.chatId || ''), String(c?.userId || '')]));
      orders.forEach((order) => {
        const chatId = String(order?.chatId || '').trim();
        if (!chatId) return;
        const rawId = String(chatIdToUserId.get(chatId) || '').trim();
        const emailKey = String((chats || []).find((c) => String(c?.chatId) === chatId)?.userEmail || '').toLowerCase();
        const mappedId = emailToId.get(emailKey) ? String(emailToId.get(emailKey)) : '';
        const resolvedId = usersMap.has(rawId) ? rawId : (mappedId || rawId);
        if (!resolvedId || !usersMap.has(resolvedId)) return;

        const u = usersMap.get(resolvedId);
        u.firstName = order.firstName || u.firstName;
        u.lastName = order.lastName || u.lastName;
        u.phone = order.contact || u.phone;
        u.ordersCount = (u.ordersCount || 0) + 1;
      });

      // Считаем чаты для каждого пользователя
      const chatsCountMap = new Map();
      chats.forEach(chat => {
        const emailKey = (chat.userEmail || '').toLowerCase();
        const rawId = chat.userId ? String(chat.userId) : '';
        const mappedId = emailToId.get(emailKey) ? String(emailToId.get(emailKey)) : '';
        const resolvedId = usersMap.has(rawId) ? rawId : (mappedId || rawId);
        if (resolvedId) {
          chatsCountMap.set(resolvedId, (chatsCountMap.get(resolvedId) || 0) + 1);
        }
      });
      chatsCountMap.forEach((count, uid) => {
        if (usersMap.has(uid)) {
          usersMap.get(uid).chatsCount = count;
        }
      });

      setAllUsers(Array.from(usersMap.values()));
    } catch (error) { 
      console.error('Error loading users:', error); 
      setAllUsers([]);
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    if (activeSection === 'chats') {
      if (window.innerWidth < 1024) {
        setMobileChatListOpen(!activeId);
      } else {
        setMobileChatListOpen(true);
      }
    }
    if (activeSection === 'clients') {
      setClientsSelectedClient(null);
    }
    if (activeSection === 'orders') {
      setSelectedOrdersUserKey(null);
      setMobileOrdersListOpen(true);
      setOrdersSearchQuery('');
    }
  }, [activeSection]);

  const [userStats, setUserStats] = useState(null);
  const loadUserStats = async (userId) => {
    try {
      const stats = await analyticsAPI.getUserStats(userId);
      setUserStats(stats || {});
    } catch (error) {
      console.error('Error loading user stats:', error);
      setUserStats({});
    }
  };

  useEffect(() => {
    if (activeSection === 'stats' && !selectedClient && (allUsers || []).length > 0) {
      const first = allUsers[0];
      setSelectedClient(first);
      loadUserStats(first.id);
    }
  }, [activeSection, allUsers]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadChats(), loadOrders()]);
        await loadAllUsers();
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

// FIXED: Global handlers moved to separate useEffect (runs once)
// Socket listeners for online status + deletes (NOT messages)
  useEffect(() => {
    if (!user?._id) return;

    console.log('🔌 MANAGERPANEL SOCKET INIT →', user._id, 'admin');

    const socket = initSocket(user._id, 'admin', user.email);

    const handleConnect = () => {
      console.log('🔌 MANAGERPANEL CONNECTED →', socket.id?.slice(0,8), '(admin)');
    };
    const handleDisconnect = (reason) => {
      console.log('🔌 MANAGERPANEL DISCONNECTED →', reason);
    };
    const handleOnlineUsers = (ids) => {
      const list = Array.isArray(ids) ? ids : [];
      const next = new Set(list.map(String));
      setOnlineUserIds(next);
    };
    const handleUserOnline = ({ userId }) => {
      if (!userId) return;
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        next.add(String(userId));
        return next;
      });
    };
    const handleUserOffline = ({ userId }) => {
      if (!userId) return;
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });
    };
    const handleMessageDeleted = ({ messageId }) => {
      console.log('🗑️ MANAGERPANEL message-deleted ←', messageId);
      setMessages(prev => prev.filter(m => (m._id || m.id) !== messageId));
    };
    const handleOrderCreated = ({ chatId, order }) => {
      console.log('📦 MANAGERPANEL order-created ←', chatId);
      loadOrders();
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('online-users', handleOnlineUsers);
    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('order-created', handleOrderCreated);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('online-users', handleOnlineUsers);
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('order-created', handleOrderCreated);
    };
  }, [user?._id]);

// GLOBAL new-message handler (ALL chats)
  useEffect(() => {
    if (!user?._id) return;
    const socket = getSocket();
    if (!socket?.connected) return;

    const handleGlobalNewMessage = (message) => {
      console.log('📨 MANAGERPANEL-GLOBAL ← new-message:', message?._id?.slice(0,8), 'chat:', message?.chatId);
      if (!message) return;
      const raw = message || {};
      const normalized = {
        ...raw,
        fileName: raw.fileName || raw.attachments?.[0]?.originalName,
        fileSize: raw.fileSize || raw.attachments?.[0]?.size,
        fileType: raw.fileType || raw.attachments?.[0]?.mimetype,
        fileUrl: raw.fileUrl || raw.attachments?.[0]?.url
      };
      const messageId = normalized._id || normalized.id;
      if (!messageId) return;

      // Update messages for ACTIVE chat + notify for others
      setMessages((prev) => {
        if (String(normalized.chatId) !== String(activeId)) {
          // NEW message in OTHER chat → Visual bell (unread count?)
          // Don't add to current messages
          return prev;
        }
        // ACTIVE chat → normal upsert
        if (prev.some((m) => (m._id || m.id) === messageId)) return prev;
        const list = Array.isArray(prev) ? [...prev] : [];
        if (normalized?.senderId === 'manager') {
          for (let i = list.length - 1; i >= 0; i -= 1) {
            const m = list[i];
            const id = String(m?._id || m?.id || '');
            if (String(m?.senderId) !== 'manager') continue;
            if (!id.startsWith('temp_')) continue;
            if (String(m?.text || '') !== String(normalized?.text || '')) continue;
            list.splice(i, 1);
            break;
          }
        }
        return [...list, normalized];
      });
      if (String(message.chatId) === String(activeId)) {
        try {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);
          try { import('../utils/sound').then(m => m.playSound('adminMsg')).catch(() => { void 0; }); } catch { void 0; }
        } catch { void 0; }
      }
    };

    socket.on('new-message', handleGlobalNewMessage);
    return () => socket.off('new-message', handleGlobalNewMessage);
  }, [user?._id, activeId]); // Re-filter on activeId change

  useEffect(() => {
    if (!user?._id) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNewChatMessage = (payload) => {
      const chatId = payload?.chatId;
      const message = payload?.message;
      if (!chatId || !message) return;

      const raw = message || {};
      const normalized = {
        ...raw,
        chatId,
        fileName: raw.fileName || raw.attachments?.[0]?.originalName,
        fileSize: raw.fileSize || raw.attachments?.[0]?.size,
        fileType: raw.fileType || raw.attachments?.[0]?.mimetype,
        fileUrl: raw.fileUrl || raw.attachments?.[0]?.url
      };

      const lastText = String(normalized.text || '').trim();
      const lastMessage = lastText || (normalized.fileName ? `📎 ${normalized.fileName}` : '');
      const lastUpdate = normalized.createdAt || new Date().toISOString();
      const shouldUnread = !(activeSection === 'chats' && String(activeId) === String(chatId));

      setChats((prev) => {
        const list = Array.isArray(prev) ? [...prev] : [];
        const idx = list.findIndex((c) => String(c?.chatId) === String(chatId));
        if (idx === -1) return prev;
        const updated = { ...(list[idx] || {}) };
        updated.lastMessage = lastMessage;
        updated.lastUpdate = lastUpdate;
        updated.unread = shouldUnread ? true : false;
        list.splice(idx, 1);
        list.unshift(updated);
        return list;
      });

      if (shouldUnread) {
        try { import('../utils/sound').then(m => m.playSound('adminMsg')).catch(() => { void 0; }); } catch { void 0; }
      }
    };

    socket.on('new-chat-message', handleNewChatMessage);
    return () => socket.off('new-chat-message', handleNewChatMessage);
  }, [user?._id, activeId, activeSection]);

  useEffect(() => {
    if (!activeId || activeSection !== 'chats') { 
      setMessages([]); 
      return; 
    }
    
    const loadMessages = async () => {
      try {
        const msgs = await chatsAPI.getMessages(activeId);
        console.log('=== LOADED MESSAGES ===');
        console.log('Raw messages:', msgs);
        
        // Преобразуем сообщения с attachments в правильный формат
        const processedMessages = (msgs || []).map(msg => {
          console.log('Processing message:', msg);
          
          // Проверяем разные форматы файлов
          if (msg.attachments && msg.attachments.length > 0) {
            const attachment = msg.attachments[0];
            console.log('Found attachment:', attachment);
            
            return {
              ...msg,
              fileName: attachment.originalName || attachment.filename,
              fileSize: attachment.size,
              fileType: attachment.mimetype || attachment.type,
              fileUrl: attachment.url
            };
          }
          
          // Проверяем прямые поля файла
          if (msg.fileName || msg.fileUrl) {
            console.log('Found direct file fields:', {
              fileName: msg.fileName,
              fileSize: msg.fileSize,
              fileType: msg.fileType,
              fileUrl: msg.fileUrl
            });
            
            return {
              ...msg,
              fileName: msg.fileName,
              fileSize: msg.fileSize,
              fileType: msg.fileType,
              fileUrl: msg.fileUrl
            };
          }
          
          return msg;
        });
        
        console.log('Processed messages:', processedMessages);
        setMessages(processedMessages);
          try {
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
          } catch { /* ignore */ }
        
        // Отмечаем как прочитанные
        await chatsAPI.markAsRead(activeId);
        setChats(prev => prev.map(c => c.chatId === activeId ? { ...c, unread: false } : c));
        
        const socket = getSocket();
        if (socket) {
          socket.emit('join-chat', activeId);
          socket.emit('mark-read', activeId);
        }
      } catch (error) { 
        console.error('Error loading messages:', error);
      }
    };
    
    loadMessages();
  }, [activeId, activeSection]);

  const executeSend = async (textOverride) => {
    const textToSend = textOverride || inputText;
    if (!activeId || !textToSend.trim()) return;
    
    try {
      const socket = getSocket();
      const replyText = replyToMsg?.text ? String(replyToMsg.text).replace(/\s+/g, ' ').trim().slice(0, 120) : '';
      const composedText = replyText ? `↩️ ${replyText}\n${textToSend}` : textToSend;
      const tempId = `temp_${Date.now()}`;
      const newMessage = {
        _id: tempId,
        senderId: 'manager',
        text: composedText,
        createdAt: new Date().toISOString()
      };

      // Сначала добавляем сообщение в UI для мгновенного отображения
      setMessages(prev => [...prev, newMessage]);
      if (!textOverride) setInputText("");
      setReplyToMsg(null);

      // Затем отправляем через Socket.io или API
      if (socket && socket.connected) {
        socket.emit('send-message', { chatId: activeId, text: composedText, clientTempId: tempId });
      } else {
        // Fallback на API если Socket не работает
        const created = await messagesAPI.send(activeId, composedText);
        if (created && (created._id || created.id)) {
          const createdId = created._id || created.id;
          setMessages((prev) => prev.map((m) => ((m._id || m.id) === tempId ? { ...created, _id: createdId } : m)));
        }
      }

      // Обновляем список чатов
      loadChats();
        try {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } catch { /* ignore */ }
    } catch (err) { 
      console.error('Error sending message:', err);
      alert('Ошибка отправки сообщения');
    }
  };

  const handleSendScript = async (script) => {
    if (!activeId) {
      alert('Выберите чат для отправки сообщения');
      return;
    }
    if (isSignatureScript(script)) {
      const payload = parseSignatureScript(script);
      if (!payload?.file?.url) {
        alert('Шаблон подписи некорректен');
        return;
      }
      try {
        await signaturesAPI.create({
          chatId: activeId,
          file: payload.file,
          managerSignatureDataUrl: payload.managerSignatureDataUrl || null,
          managerSignPos: payload.managerSignPos || null
        });
        setActiveSection('chats');
      } catch {
        alert('Не удалось создать запрос подписи');
      }
    } else {
      try {
        const text = String(script?.text || '').trim();
        if (text) {
          await executeSend(text);
        }
        const files = Array.isArray(script?.files) ? script.files : [];
        for (const f of files) {
          const url = filesAPI.getFileUrl(f?.url);
          if (!url) continue;
          try {
            const resp = await fetch(url);
            const blob = await resp.blob();
            const fileName = String(f?.name || 'file');
            const fileType = String(f?.type || blob.type || '');
            const fileObj = new File([blob], fileName, { type: fileType });
            await filesAPI.upload(fileObj, activeId);
          } catch {
            const fallbackName = String(f?.name || 'file');
            await executeSend(`📎 ${fallbackName}\n${url}`);
          }
        }
      } catch {
        alert('Не удалось отправить скрипт');
      }
    }
    setShowScriptMenu(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeId) {
      alert('Выберите файл и откройте чат');
      return;
    }

    // Проверка размера файла (фото/видео до 100MB, остальные до 10MB)
    const isMedia = String(file.type || '').startsWith('image/') || String(file.type || '').startsWith('video/');
    const maxSizeMb = isMedia ? 100 : 10;
    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`Файл слишком большой. Максимальный размер: ${maxSizeMb}MB`);
      return;
    }

    setUploading(true);
    try {
      // Показываем индикатор загрузки файла
      const tempFileId = 'uploading_' + Date.now();
      const tempMessage = {
        _id: tempFileId,
        senderId: 'manager',
        text: `📎 Загрузка файла: ${file.name} (${formatFileSize(file.size)})...`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        isUploading: true,
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempMessage]);

      // Используем правильный multipart API
      const result = await filesAPI.upload(file, activeId);

      // Убираем индикатор загрузки
      setMessages(prev => prev.filter(m => m._id !== tempFileId));

      const serverMessage = result?.message;
      if (serverMessage && (serverMessage._id || serverMessage.id)) {
        const normalized = {
          ...serverMessage,
          fileName: serverMessage.fileName || serverMessage.attachments?.[0]?.originalName,
          fileSize: serverMessage.fileSize || serverMessage.attachments?.[0]?.size,
          fileType: serverMessage.fileType || serverMessage.attachments?.[0]?.mimetype,
          fileUrl: serverMessage.fileUrl || serverMessage.attachments?.[0]?.url
        };
        setMessages(prev => {
          const id = normalized._id || normalized.id;
          if (prev.some(m => (m._id || m.id) === id)) return prev;
          return [...prev, normalized];
        });
      }
      
      // Обновляем список чатов
      loadChats();
      
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Убираем индикатор загрузки
      setMessages(prev => prev.filter(m => !m.isUploading));
      
      // Показываем сообщение об ошибке
      alert(`Ошибка загрузки файла: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setUploading(false);
      // Сбрасываем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Удалить это сообщение?")) return;
    
    try {
      const id = String(msgId || '');
      // Сначала удаляем из UI для мгновенного отклика
      setMessages(prev => prev.filter(m => (m._id || m.id) !== msgId));
      setContextMenuMsg(null);
      if (!id || id.startsWith('temp_') || id.startsWith('uploading_')) return;
      
      // Затем пытаемся удалить на сервере
      await messagesAPI.delete(msgId);
    } catch (err) { 
      console.error('Ошибка удаления сообщения:', err);
      alert('Не удалось удалить сообщение');
      // Откатываем изменения если ошибка
      loadChats();
    }
  };

  const handleDeleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return;
    if (!window.confirm(`Удалить ${selectedMessages.size} сообщений?`)) return;

    try {
      const ids = Array.from(selectedMessages);
      setMessages(prev => prev.filter(m => !ids.includes(m._id || m.id)));
      setSelectedMessages(new Set());

      // Удаляем на сервере
      await Promise.all(ids.map(id => messagesAPI.delete(id).catch(() => null)));
    } catch (err) {
      console.error('Ошибка удаления сообщений:', err);
      alert('Не удалось удалить сообщения');
      loadChats();
    }
  };

  const handleMessageMouseDown = (msg) => {
    const timer = setTimeout(() => {
      setContextMenuMsg(msg);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleMessageMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleClearChat = async () => {
    if (!activeId) return;
    if (!window.confirm('Очистить чат? Будут удалены все сообщения.')) return;

    try {
      setMessages([]);
      await chatsAPI.clearMessages(activeId);
      loadChats();
    } catch (err) {
      console.error('Ошибка очистки чата:', err);
      alert('Не удалось очистить чат');
      loadChats();
    }
  };

  const handleDeleteChat = async () => {
    if (!activeId) return;
    if (!window.confirm('Удалить чат? Будут удалены чат и все сообщения.')) return;

    const deletingId = activeId;
    try {
      setMessages([]);
      setActiveId(null);
      await chatsAPI.deleteChat(deletingId);
      loadChats();
    } catch (err) {
      console.error('Ошибка удаления чата:', err);
      alert('Не удалось удалить чат');
      setActiveId(deletingId);
      loadChats();
    }
  };

  const handleUpdateOrderStatus = async (chatId, orderIndex, status) => {
    try {
      console.log('Updating order status:', { chatId, orderIndex, status });
      await ordersAPI.updateStatus(chatId, orderIndex, status);
      setOrders((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map((o) => (String(o?.chatId) === String(chatId) && Number(o?.orderIndex) === Number(orderIndex) ? { ...o, status } : o));
      });
      setOrderStatusOverride(`${chatId}:${orderIndex}`, status);
      loadOrders();
    } catch (err) { 
      console.error('Error updating order status:', err); 
      alert('Ошибка обновления статуса: ' + err.message);
    }
  };

  const handleDeleteOrder = async (chatId, orderIndex) => {
    if (!window.confirm("Удалить заказ?")) return;
    try {
      console.log('Deleting order:', { chatId, orderIndex });
      
      // Сначала удаляем из UI
      setOrders(prev => prev.filter(order => !(order.chatId === chatId && order.orderIndex === orderIndex)));
      
      // Затем пытаемся удалить на сервере
      await ordersAPI.delete(chatId, orderIndex);
    } catch (err) {
      console.error(err);
      alert("Ошибка при удалении заказа: " + err.message);
      // Откатываем изменения если ошибка
      loadOrders();
    }
  };

  const handleDeleteScript = (scriptId) => {
    if (!window.confirm("Удалить скрипт?")) return;
    try {
      setScripts((prev) => (prev || []).filter((s) => s.id !== scriptId));
    } catch (err) {
      console.error('Ошибка удаления скрипта:', err);
      alert('Не удалось удалить скрипт');
    }
  };

  const handleSaveScript = () => {
    const hasText = !!String(newScript.text || '').trim();
    const hasFiles = Array.isArray(newScript.files) && newScript.files.length > 0;
    if (!newScript.title || (!hasText && !hasFiles)) return;

    const payload = { ...newScript, title: String(newScript.title).trim(), text: String(newScript.text).trim() };

    setScripts((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      if (editingScriptId) {
        return list.map((s) => (s.id === editingScriptId ? { ...payload, id: editingScriptId } : s));
      }
      return [...list, { ...payload, id: Date.now() }];
    });

    if (editingScriptId) setEditingScriptId(null);
    setNewScript({ title: '', text: '', files: [] });
  };

  const handleEditScript = (s) => {
    setNewScript({ title: s.title, text: s.text, files: Array.isArray(s.files) ? s.files : [] });
    setEditingScriptId(s.id);
  };

  const openNewScript = () => {
    setEditingScriptId(null);
    setNewScript({ title: '', text: '', files: [] });
    setScriptEditorOpen(true);
  };

  const openEditScript = (s) => {
    handleEditScript(s);
    setScriptEditorOpen(true);
  };

  const closeScriptEditor = () => {
    setScriptEditorOpen(false);
    setEditingScriptId(null);
    setNewScript({ title: '', text: '', files: [] });
  };

  const handleScriptFilesSelect = async (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length === 0) return;
    setScriptFilesUploading(true);
    try {
      const uploaded = [];
      for (const file of list) {
        const res = await filesAPI.upload(file, null);
        const url = res?.fileUrl || res?.fileUrl?.url || res?.attachment?.url || res?.message?.fileUrl || res?.data?.fileUrl;
        const name = res?.fileName || file.name;
        const type = res?.fileType || file.type || '';
        const size = res?.fileSize || file.size || 0;
        if (url) uploaded.push({ name, type, size, url });
      }
      if (uploaded.length > 0) {
        setNewScript((prev) => ({ ...prev, files: [...(prev.files || []), ...uploaded] }));
      }
    } catch (err) {
      alert('Не удалось загрузить файл для скрипта');
    } finally {
      setScriptFilesUploading(false);
      try { e.target.value = ''; } catch { void 0; }
    }
  };

  const removeScriptFile = (idx) => {
    setNewScript((prev) => ({ ...prev, files: (prev.files || []).filter((_, i) => i !== idx) }));
  };

  const handleSaveSiteContent = async () => {
    try {
      // Здесь будет API для сохранения контента сайта
      alert('Контент сайта сохранен!');
    } catch (error) {
      console.error('Error saving site content:', error);
      alert('Ошибка сохранения контента');
    }
  };

  const handleSaveService = () => {
    if (editingService) {
      setServices(services.map(s => s.id === editingService.id ? editingService : s));
      setEditingService(null);
    }
  };

  const handleDeleteService = (serviceId) => {
    if (!window.confirm("Удалить услугу?")) return;
    setServices(services.filter(s => s.id !== serviceId));
  };

  const handleAddService = () => {
    const newService = {
      id: `S${services.length + 1}_T`,
      name: 'Новая услуга',
      description: 'Описание новой услуги',
      active: true
    };
    setServices([...services, newService]);
  };

  const startChat = async (userId, email) => {
    try {
      const userChat = getClientChat(userId, email);
      if (userChat) {
        setActiveId(userChat.chatId);
        setActiveSection('chats');
        setMobileChatListOpen(false);
        return;
      }

      const created = await chatsAPI.startChat(userId);
      if (created?.chatId) {
        setChats((prev) => {
          const exists = prev.some(c => String(c.chatId) === String(created.chatId));
          if (exists) return prev;
          return [created, ...prev];
        });
        setActiveId(created.chatId);
        setActiveSection('chats');
        setMobileChatListOpen(false);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Ошибка при открытии чата');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a18] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Загрузка панели управления...</p>
        </div>
      </div>
    );
  }

  const unreadMessagesCount = (chats || []).reduce((sum, c) => {
    if (typeof c?.unread === 'number') return sum + c.unread;
    return sum + (c?.unread ? 1 : 0);
  }, 0);

  const newOrders = (orders || []).filter((o) => o?.status === 'new');
  const unseenNewOrdersCount = newOrders.filter((o) => !seenOrders.includes(getOrderKey(o))).length;

  const filteredOrders = (orders || []).filter((order) => filterStatus === 'all' || order?.status === filterStatus);
  const chatById = new Map((chats || []).map((c) => [String(c?.chatId), c]));
  const ordersByUser = new Map();

  filteredOrders.forEach((order) => {
    const chat = chatById.get(String(order?.chatId)) || null;
    const emailRaw = chat?.userEmail || order?.email || '';
    const email = normalizeEmail(emailRaw);
    const key = email || String(order?.chatId || '');
    if (!key) return;

    const u = email ? (allUsers || []).find((x) => normalizeEmail(x?.email) === email) : null;
    const name =
      (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '') ||
      `${order?.firstName || ''} ${order?.lastName || ''}`.trim() ||
      (email ? email.split('@')[0] : 'User');

    if (!ordersByUser.has(key)) {
      ordersByUser.set(key, { key, email, name, orders: [] });
    }
    ordersByUser.get(key).orders.push(order);
  });

  const ordersSearchQ = String(ordersSearchQuery || '').trim().toLowerCase();
  const orderUsers = Array.from(ordersByUser.values())
    .filter((entry) => {
      if (!ordersSearchQ) return true;
      return (
        String(entry?.name || '').toLowerCase().includes(ordersSearchQ) ||
        String(entry?.email || '').toLowerCase().includes(ordersSearchQ)
      );
    })
    .map((entry) => {
      const unseenCount = (entry.orders || []).reduce((acc, o) => acc + (seenOrders.includes(getOrderKey(o)) ? 0 : 1), 0);
      const newCount = (entry.orders || []).reduce((acc, o) => acc + (o?.status === 'new' ? 1 : 0), 0);
      return { ...entry, unseenCount, newCount, count: (entry.orders || []).length };
    })
    .sort((a, b) => {
      if (b.newCount !== a.newCount) return b.newCount - a.newCount;
      if (b.unseenCount !== a.unseenCount) return b.unseenCount - a.unseenCount;
      return String(a.name).localeCompare(String(b.name));
    });

  const adminLabel = (
    user?.name ||
    user?.login ||
    user?.username ||
    user?.email?.split('@')?.[0] ||
    'Admin'
  );

  const renderChatMessageAvatar = (isManagerSender, userEmail) => {
    if (isManagerSender) {
      const fallbackLetter = (String(adminLabel)[0] || 'A').toUpperCase();
      return (
        <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 flex items-center justify-center font-bold text-[10px] sm:text-[11px] text-blue-200">
            {fallbackLetter}
          </div>
          {adminAvatarUrl ? (
            <img
              src={adminAvatarUrl}
              alt="avatar"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : null}
        </div>
      );
    }

    const key = normalizeEmail(userEmail);
    const u = (allUsers || []).find((x) => normalizeEmail(x?.email) === key) || null;
    const name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : (String(userEmail || '').split('@')[0] || 'User');
    return (
      <UserAvatar 
        email={userEmail} 
        name={name}
        size="w-6 h-6 sm:w-7 sm:h-7" 
        className="shrink-0"
      />
    );
  };

  return (
    <div className={`flex flex-col ${i18n.language === 'ka' ? 'font-georgian' : 'font-sans'} bg-[#050a18] text-white ${activeSection === 'chats' ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>

      {error && (
        <div className="fixed inset-0 z-[9999] bg-[#050a18] flex items-center justify-center p-6">
          <div className="text-center max-w-lg">
            <div className="text-red-400 text-xl mb-4">Произошла ошибка</div>
            <p className="text-white mb-4">{error.message}</p>
            <button 
              onClick={() => setError(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Перезагрузить
            </button>
          </div>
        </div>
      )}
      
      {/* Навигация */}
      <nav className="fixed top-0 w-full z-50 bg-[#050a18]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Логотип */}
            <div className="flex items-center space-x-4 cursor-pointer" onClick={() => { setActiveSection('dashboard'); setMobileMenuOpen(false); }}>
              <img src="/img/logo.png" alt="logo" className="w-[50px] h-[50px] object-contain" />
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-400">CONNECTOR</h1>
                <p className="text-xs text-blue-400">{t('MP_PANEL')}</p>
              </div>
            </div>

            {/* Desktop навигация */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      activeSection === item.id
                        ? `${brandGradient} text-white shadow-lg`
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.id === 'chats' && unreadMessagesCount > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px]">
                        {unreadMessagesCount}
                      </span>
                    )}
                    {item.id === 'orders' && unseenNewOrdersCount > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-yellow-500 text-black text-[10px]">
                        {unseenNewOrdersCount}
                      </span>
                    )}
                    <span>{t(item.labelKey)}</span>
                  </button>
                );
              })}
            </div>

            {/* Правая часть навигации */}
            <div className="flex items-center space-x-3">
              {/* Статистика для десктопа */}
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">{allUsers.filter(u => isUserOnline(u)).length}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Package className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">{orders.filter(o => o.status === 'new').length}</span>
                </div>
              </div>
              <div className="hidden md:block">
                <select onChange={changeLanguage} value={i18n.language} className="bg-transparent border border-blue-500/30 rounded-lg px-2 py-2 outline-none text-xs cursor-pointer">
                  <option value="ru" className="bg-[#0a0a0a]">RU</option>
                  <option value="en" className="bg-[#0a0a0a]">ENG</option>
                  <option value="ka" className="bg-[#0a0a0a]">GEO</option>
                </select>
              </div>

              {/* Выход */}
              <button
                onClick={() => { removeToken(); window.location.href = '/'; }}
                className="hidden lg:flex p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                title={t('LOGOUT')}
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Мобильное меню */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile меню */}
          {mobileMenuOpen && (
            <div className="lg:hidden">
              <div
                className="fixed inset-0 bg-black/80 z-30"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="fixed left-0 right-0 top-16 z-40 px-4 py-6 overflow-y-auto">
                <div className="mx-auto max-w-sm bg-[#050a18] border border-white/10 rounded-2xl p-4 shadow-2xl">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="text-sm font-semibold text-white">{t('SETTINGS')}</div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={() => { setMobileMenuOpen(false); handleMakeBackup(); }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm text-green-300 hover:text-green-200 hover:bg-green-500/10 border border-green-500/20"
                    >
                      <Save className="w-4 h-4" />
                      <span className="text-center">Резервное копирование</span>
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); handleDownloadBackup(); }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm text-blue-300 hover:text-blue-200 hover:bg-blue-500/10 border border-blue-500/20"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-center">Скачать данные</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSection('scripts');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 border border-purple-500/20"
                    >
                      <Code className="w-4 h-4" />
                      <span className="text-center">{t('MP_SCRIPTS')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSection('stats');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10 border border-cyan-500/20"
                    >
                      <Activity className="w-4 h-4" />
                      <span className="text-center">{t('MP_STATS') || 'Статистика'}</span>
                    </button>
                  </div>

                  <div className="mt-4">
                    <select onChange={changeLanguage} value={i18n.language} className="w-full bg-transparent border border-blue-500/30 rounded-lg px-3 py-2 outline-none text-sm cursor-pointer">
                      <option value="ru" className="bg-[#0a0a0a]">RU</option>
                      <option value="en" className="bg-[#0a0a0a]">ENG</option>
                      <option value="ka" className="bg-[#0a0a0a]">GEO</option>
                    </select>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        removeToken();
                        window.location.href = '/';
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 border border-red-500/20"
                      title={t('LOGOUT')}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-center">{t('LOGOUT')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Раздел «Подписи» удалён */}
        </div>
      </nav>

      {/* Основной контент */}
      <main className={`flex-grow pt-16 ${activeSection === 'chats' ? 'h-screen h-[100dvh] overflow-hidden pb-12' : 'pb-20'}`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${activeSection === 'chats' ? 'py-0 h-full' : 'py-6'}`}>
          {/* Кнопки резервного копирования на ПК (под навигацией) */}
          <div className="hidden lg:flex items-center gap-3 mb-4">
            <button
              onClick={handleMakeBackup}
              className="px-4 py-2 rounded-lg bg-green-600/20 border border-green-500/30 text-green-200 hover:bg-green-600/30 transition"
            >
              Резервное копирование
            </button>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-200 hover:bg-blue-600/30 transition"
            >
              Скачать данные
            </button>
          </div>
          
          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <div className="space-y-4 sm:space-y-6">
             

              <button
                onClick={() => setSystemOverviewOpen((v) => !v)}
                className="w-full flex items-center justify-between text-left"
                type="button"
              >
                <h2 className="text-lg sm:text-2xl font-bold text-white">Обзор системы</h2>
                <ChevronDown className={`w-5 h-5 text-white/70 transition-transform ${systemOverviewOpen ? 'rotate-180' : ''}`} />
              </button>

              {systemOverviewOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"></div>
              )}

              {/* Desktop: большие карточки */}
              <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-300">Всего клиентов</p>
                      <p className="text-3xl font-bold text-white">{allUsers.length}</p>
                      <p className="text-xs text-blue-400 mt-1">{allUsers.filter(u => isUserOnline(u)).length} онлайн</p>
                    </div>
                    <Users className="w-10 h-10 text-blue-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-300">Активные чаты</p>
                      <p className="text-3xl font-bold text-white">{chats.filter(c => c.status === 'active').length}</p>
                      <p className="text-xs text-green-400 mt-1">активных сегодня</p>
                    </div>
                    <MessageSquare className="w-10 h-10 text-green-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-300">Новые заказы</p>
                      <p className="text-3xl font-bold text-white">{orders.filter(o => o.status === 'new').length}</p>
                      <p className="text-xs text-yellow-400 mt-1">Требуют внимания</p>
                    </div>
                    <Package className="w-10 h-10 text-yellow-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-300">Скрипты</p>
                      <p className="text-3xl font-bold text-white">{scripts.length}</p>
                      <p className="text-xs text-purple-400 mt-1">быстрых ответов</p>
                    </div>
                    <Code className="w-10 h-10 text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Mobile: горизонтальные маленькие иконки */}
              <div className="sm:hidden">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Users className="w-5 h-5 text-blue-400" />
                      <span className="text-lg font-bold text-white">{allUsers.length}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-300">Клиенты</div>
                    <div className="text-[10px] text-blue-400">{allUsers.filter(u => isUserOnline(u)).length} онлайн</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <MessageSquare className="w-5 h-5 text-green-400" />
                      <span className="text-lg font-bold text-white">{chats.filter(c => c.status === 'active').length}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-300">Активные чаты</div>
                    <div className="text-[10px] text-green-400">активные сегодня</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Code className="w-5 h-5 text-purple-400" />
                      <span className="text-lg font-bold text-white">{scripts.length}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-300">Скрипты</div>
                    <div className="text-[10px] text-purple-400">быстрых ответов</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Клиенты */}
          {activeSection === 'clients' && (
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full lg:h-[calc(100vh-8rem)] overflow-hidden">
              {/* Список клиентов */}
              <div className={`${clientsSelectedClient ? 'hidden lg:flex' : 'flex'} lg:flex-none lg:w-80 flex-col bg-[#050a18] lg:bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex-1`}>
                <div className="p-2.5 border-b border-white/10">
                  <h2 className="text-base font-bold text-white">Клиенты</h2>
                </div>
                <div className="overflow-y-auto flex-1">
                  {allUsers.map(client => (
                    <div
                      key={client.id}
                      onClick={() => setClientsSelectedClient(client)}
                      className={`p-2.5 flex items-center gap-2.5 cursor-pointer transition-colors ${
                        clientsSelectedClient?.id === client.id ? 'bg-blue-600/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <UserAvatar 
                        email={client.email} 
                        name={`${client.firstName || ''} ${client.lastName || ''}`.trim()}
                        size="w-9 h-9" 
                        showStatus={true}
                        isOnline={isUserOnline(client)} 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-white truncate">
                          {client.firstName} {client.lastName}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">{client.email}</div>
                      </div>
                      <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${
                        isUserOnline(client) ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {isUserOnline(client) ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Детали клиента */}
              <div className={`flex-1 bg-[#050a18] lg:bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden ${clientsSelectedClient ? 'flex flex-col' : 'hidden lg:flex flex-col'}`}>
                {clientsSelectedClient ? (
                  <>
                    <div className="p-2.5 border-b border-white/10 bg-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserAvatar 
                          email={clientsSelectedClient.email} 
                          name={`${clientsSelectedClient.firstName || ''} ${clientsSelectedClient.lastName || ''}`.trim()}
                          size="w-9 h-9"
                          showStatus={true}
                          isOnline={isUserOnline(clientsSelectedClient)} 
                        />
                        <div>
                          <h3 className="text-sm font-semibold text-white">
                            {clientsSelectedClient.firstName} {clientsSelectedClient.lastName}
                          </h3>
                          <p className="text-[11px] text-gray-400">{clientsSelectedClient.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setClientsSelectedClient(null)}
                        className="lg:hidden p-1.5 rounded-full text-white hover:bg-white/5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                          <div className="text-[11px] text-gray-400 mb-1">Телефон</div>
                          <div className="text-[12px] text-white">{clientsSelectedClient.phone || 'Не указан'}</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                          <div className="text-[11px] text-gray-400 mb-1">Город</div>
                          <div className="text-[12px] text-white">{clientsSelectedClient.city || 'Не указан'}</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                          <div className="text-[11px] text-gray-400 mb-1">Заказы</div>
                          <div className="text-[12px] text-white">{clientsSelectedClient.ordersCount || 0}</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                          <div className="text-[11px] text-gray-400 mb-1">Чаты</div>
                          <div className="text-[12px] text-white">{clientsSelectedClient.chatsCount || 0}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!clientsSelectedClient) return;
                            startChat(clientsSelectedClient.id, clientsSelectedClient.email);
                          }}
                          className="flex-1 px-3 py-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-300 text-[13px] hover:bg-blue-600/30"
                        >
                          Открыть чат
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">Выберите клиента</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Статистика */}
          {activeSection === 'stats' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Статистика пользователей</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Поиск пользователей..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/10 text-white/80 text-sm">Пользователи</div>
                  <div className="max-h-[50vh] overflow-y-auto">
                    {(allUsers || [])
                      .filter(u => 
                        (u.firstName + ' ' + u.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(u => (
                        <button
                          key={u.id}
                          onClick={() => { setSelectedClient(u); loadUserStats(u.id); }}
                          className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/5 text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <UserAvatar
                              email={u.email}
                              name={`${u.firstName || ''} ${u.lastName || ''}`.trim()}
                              size="w-9 h-9"
                              showStatus={true}
                              isOnline={isUserOnline(u)}
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white truncate">
                                {u.firstName} {u.lastName}
                              </div>
                              <div className="text-xs text-gray-400 truncate">{u.email}</div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            isUserOnline(u) ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {isUserOnline(u) ? 'Онлайн' : 'Офлайн'}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="text-white font-semibold">
                      {selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : 'Выберите пользователя'}
                    </div>
                    {selectedClient && (
                      <button
                        onClick={() => loadUserStats(selectedClient.id)}
                        className="flex items-center gap-2 px-3 py-1 rounded-lg border border-white/20 text-white/80 hover:bg-white/10"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Обновить
                      </button>
                    )}
                  </div>

                  <div className="p-4">
                    {!selectedClient && (
                      <div className="text-gray-300 text-sm">Выберите пользователя слева, чтобы увидеть статистику</div>
                    )}
                    {selectedClient && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                            <div className="text-sm text-blue-300">Визиты</div>
                            <div className="text-2xl font-bold text-white">{userStats?.visits?.[0]?.total || selectedClient.visitsCount || 0}</div>
                            <div className="text-xs text-blue-400 mt-1">
                              {userStats?.visits?.[0]?.lastVisit ? `Последний: ${new Date(userStats.visits[0].lastVisit).toLocaleString()}` : '—'}
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
                            <div className="text-sm text-green-300">Клики</div>
                            <div className="text-2xl font-bold text-white">
                              {userStats ? ((userStats.clicksBySection || []).reduce((sum, x) => sum + x.count, 0)) : (selectedClient.clicksCount || 0)}
                            </div>
                            <div className="text-xs text-green-400 mt-1">по секциям сайта</div>
                          </div>
                          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
                            <div className="text-sm text-purple-300">Время на сайте</div>
                            <div className="text-2xl font-bold text-white">
                              {userStats ? (() => {
                                const totalMs = (userStats.timeBySection || []).reduce((sum, x) => sum + (x.durationMs || 0), 0);
                                const s = Math.floor(totalMs / 1000);
                                const h = Math.floor(s / 3600);
                                const m = Math.floor((s % 3600) / 60);
                                const sec = s % 60;
                                return `${h}ч ${m}м ${sec}с`;
                              })() : '0ч 0м 0с'}
                            </div>
                            <div className="text-xs text-purple-400 mt-1">в сумме</div>
                          </div>
                          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-4">
                            <div className="text-sm text-yellow-300">Заказы</div>
                            <div className="text-2xl font-bold text-white">{selectedClient.ordersCount || 0}</div>
                            <div className="text-xs text-yellow-400 mt-1">всего создано</div>
                          </div>
                          <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-xl p-4">
                            <div className="text-sm text-cyan-300">Чаты</div>
                            <div className="text-2xl font-bold text-white">{selectedClient.chatsCount || 0}</div>
                            <div className="text-xs text-cyan-400 mt-1">{selectedClient.unreadCount || 0} непрочитанных</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="text-white/80 mb-2">Клики по секциям</div>
                            <div className="space-y-2">
                              {(userStats?.clicksBySection || []).map(row => (
                                <div key={row._id} className="flex items-center justify-between text-sm text-gray-300">
                                  <span>{row._id || '—'}</span>
                                  <span className="text-white">{row.count}</span>
                                </div>
                              ))}
                              {(userStats?.clicksBySection || []).length === 0 && (
                                <div className="text-gray-400 text-sm">Нет данных</div>
                              )}
                            </div>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="text-white/80 mb-2">Время по секциям</div>
                            <div className="space-y-2">
                              {(userStats?.timeBySection || []).map(row => {
                                const s = Math.floor((row.durationMs || 0) / 1000);
                                const m = Math.floor(s / 60);
                                const sec = s % 60;
                                return (
                                  <div key={row._id} className="flex items-center justify-between text-sm text-gray-300">
                                    <span>{row._id || '—'}</span>
                                    <span className="text-white">{m}м {sec}с</span>
                                  </div>
                                );
                              })}
                              {(userStats?.timeBySection || []).length === 0 && (
                                <div className="text-gray-400 text-sm">Нет данных</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <div className="text-white/80 mb-2">Время по услугам</div>
                          <div className="space-y-2">
                            {(userStats?.timeByService || []).map(row => {
                              const s = Math.floor((row.durationMs || 0) / 1000);
                              const m = Math.floor(s / 60);
                              const sec = s % 60;
                              return (
                                <div key={row._id} className="flex items-center justify-between text-sm text-gray-300">
                                  <span>{row._id || '—'}</span>
                                  <span className="text-white">{m}м {sec}с</span>
                                </div>
                              );
                            })}
                            {(userStats?.timeByService || []).length === 0 && (
                              <div className="text-gray-400 text-sm">Нет данных</div>
                            )}
                          </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <div className="text-white/80 mb-2">Последние события</div>
                          <div className="space-y-2">
                            {(userStats?.recentEvents || []).slice(0, 50).map(ev => {
                              const when = ev?.timestamp ? new Date(ev.timestamp).toLocaleString() : '';
                              const durS = ev?.durationMs ? Math.floor((ev.durationMs || 0) / 1000) : null;
                              return (
                                <div key={ev._id} className="flex items-center justify-between text-xs text-gray-300">
                                  <span className="min-w-0 truncate">
                                    {when} — {ev.action || 'event'}
                                    {ev.section ? ` · ${ev.section}` : ''}
                                    {ev.element ? ` · ${ev.element}` : ''}
                                    {ev.serviceKey ? ` · услуга: ${ev.serviceKey}` : ''}
                                  </span>
                                  <span className="text-white/60">{durS != null ? `${durS}с` : ''}</span>
                                </div>
                              );
                            })}
                            {(userStats?.recentEvents || []).length === 0 && (
                              <div className="text-gray-400 text-sm">Нет данных</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Чаты */}
          {activeSection === 'chats' && (
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full lg:h-[calc(100vh-8rem)] overflow-hidden mt-0">
              {/* Список чатов - мобильный и десктоп */}
              <div className={`${mobileChatListOpen ? 'flex' : 'hidden'} lg:flex lg:flex-none lg:w-80 bg-[#050a18] lg:bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex-col min-h-0 flex-1 lg:flex-auto`}>
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Чаты</h3>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Поиск чатов..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border-none rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto h-[calc(100%-8rem)] lg:h-[calc(100%-5rem)]">
                  {chats.filter(chat => 
                    chat.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(chat => {
                    const chatUser = allUsers.find(u => u.email === chat.userEmail);
                    const isOnline = isUserOnline(chatUser);
                    return (
                      <div
                        key={chat.chatId}
                        onClick={() => {
                          setChatActionsOpen(false);
                          setActiveId(chat.chatId);
                          setMobileChatListOpen(false);
                        }}
                        className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                          activeId === chat.chatId ? 'bg-blue-600/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <UserAvatar 
                          email={chat.userEmail} 
                          name={chatUser ? `${chatUser.firstName || ''} ${chatUser.lastName || ''}`.trim() : (chat.userEmail?.split('@')[0] || 'User')}
                          size="w-14 h-14" 
                          showStatus={true} 
                          isOnline={isOnline} 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[15px] font-semibold text-white truncate">
                              {chatUser ? `${chatUser.firstName} ${chatUser.lastName}` : (chat.userEmail?.split('@')[0] || 'Unknown User')}
                            </span>
                            <span className="text-[11px] text-gray-500 whitespace-nowrap">
                              {(() => {
                                const date = new Date(chat.lastUpdate || chat.lastMessageTime || chat.createdAt);
                                const now = new Date();
                                if (date.toDateString() === now.toDateString()) {
                                  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                }
                                return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-[13px] truncate ${chat.unread ? 'text-white font-semibold' : 'text-gray-400'}`}>
                              {chat.lastMessage || 'Нет сообщений'}
                            </p>
                            {chat.unread > 0 && (
                              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-[10px] text-white font-bold">{chat.unread}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Область чата */}
              <div className={`flex-1 bg-[#050a18] lg:bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden ${activeId && !mobileChatListOpen ? 'flex' : 'hidden lg:flex'} flex-col min-h-0`}>
                {activeId ? (
                  <>
                    {/* Заголовок чата */}
                    <div className="p-2 sm:p-3 border-b border-white/10 bg-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <UserAvatar
                            email={chats.find(c => c.chatId === activeId)?.userEmail}
                            name={(() => {
                              const email = chats.find(c => c.chatId === activeId)?.userEmail;
                              const chatUser = (allUsers || []).find(u => normalizeEmail(u?.email) === normalizeEmail(email));
                              return chatUser ? `${chatUser.firstName || ''} ${chatUser.lastName || ''}`.trim() : (email?.split('@')[0] || 'User');
                            })()}
                            size="w-8 h-8 sm:w-10 sm:h-10"
                            showStatus={true}
                            isOnline={isUserOnline(allUsers.find(u => u.email === chats.find(c => c.chatId === activeId)?.userEmail))}
                          />
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-semibold text-white truncate max-w-[120px] sm:max-w-none">
                              {(() => {
                                const chatUser = allUsers.find(u => u.email === chats.find(c => c.chatId === activeId)?.userEmail);
                                return chatUser ? `${chatUser.firstName} ${chatUser.lastName}` : (chats.find(c => c.chatId === activeId)?.userEmail?.split('@')[0] || 'Chat');
                              })()}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-gray-400">
                              {isUserOnline(allUsers.find(u => u.email === chats.find(c => c.chatId === activeId)?.userEmail)) ? 'В сети' : 'Офлайн'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setChatActionsOpen((v) => !v)}
                            className="p-2 rounded-full text-white hover:bg-white/5"
                            title="Настройки"
                          >
                            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                          </button>
                          {chatActionsOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setChatActionsOpen(false)}
                              />
                              <div className="absolute right-0 mt-2 mr-2 w-48 bg-[#050a18] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <button
                                  onClick={() => {
                                    setChatActionsOpen(false);
                                    const lastMsg = messages[messages.length - 1];
                                    if (lastMsg) setReplyToMsg(lastMsg);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                                  type="button"
                                >
                                  <Reply className="w-4 h-4" /> Ответить
                                </button>
                                <button
                                  onClick={() => {
                                    const lastMsg = messages[messages.length - 1];
                                    if (lastMsg) {
                                      setPinnedMessage(lastMsg);
                                    }
                                    setChatActionsOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                                  type="button"
                                >
                                  <Pin className="w-4 h-4" /> Закрепить
                                </button>
                                <button
                                  onClick={() => {
                                    if (messages.length > 0) {
                                      const lastMsg = messages[messages.length - 1];
                                      setSelectedMessages(new Set([lastMsg._id || lastMsg.id]));
                                    }
                                    setChatActionsOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                                  type="button"
                                >
                                  <CheckSquare className="w-4 h-4" /> Отметить одно
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedMessages(new Set(messages.map(m => m._id || m.id)));
                                    setChatActionsOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                                  type="button"
                                >
                                  <CheckSquare className="w-4 h-4" /> Отметить все
                                </button>
                                <button
                                  onClick={() => {
                                    setChatActionsOpen(false);
                                    handleClearChat();
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                                  type="button"
                                >
                                  <Trash2 className="w-4 h-4" /> Очистить чат
                                </button>
                                <button
                                  onClick={() => {
                                    setChatActionsOpen(false);
                                    handleDeleteChat();
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-red-500/10 flex items-center gap-2"
                                  type="button"
                                >
                                  <Trash2 className="w-4 h-4" /> Удалить чат
                                </button>
                              </div>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setChatActionsOpen(false);
                              setActiveId(null);
                              setMobileChatListOpen(true);
                            }}
                            className="lg:hidden p-2 rounded-full text-white hover:bg-white/5"
                            title="Назад"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {pinnedOrder && String(pinnedOrder.chatId) === String(activeId) && (
                      <div className="p-4 border-b border-white/10 bg-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs text-gray-400">Заказ прикреплён</div>
                            <div className="text-sm font-semibold text-white truncate">
                              #{pinnedOrder.orderIndex} · {(pinnedOrder.services || []).join(', ') || 'Заказ'}
                            </div>
                            {pinnedOrder.comment && (
                              <div className="mt-1 text-xs text-gray-300 italic line-clamp-2">"{pinnedOrder.comment}"</div>
                            )}
                          </div>
                          <button
                            onClick={() => setPinnedOrder(null)}
                            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                            title="Открепить"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {pinnedMessage && (
                      <div className="p-4 border-b border-white/10 bg-blue-500/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs text-blue-300 flex items-center gap-1">
                              <Pin className="w-3 h-3" />
                              Прикреплённое сообщение
                            </div>
                            <div className="text-sm text-white mt-1 line-clamp-3">
                              {pinnedMessage.text}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(pinnedMessage.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => setPinnedMessage(null)}
                            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                            title="Открепить"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedMessages.size > 0 && (
                      <div className="p-3 border-b border-white/10 bg-red-500/10 flex items-center justify-between">
                        <span className="text-sm text-red-300">
                          Выбрано: {selectedMessages.size}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedMessages(new Set())}
                            className="px-3 py-1 text-xs bg-white/10 rounded-lg text-white hover:bg-white/20"
                          >
                            Отменить
                          </button>
                          <button
                            onClick={handleDeleteSelectedMessages}
                            className="px-3 py-1 text-xs bg-red-600 rounded-lg text-white hover:bg-red-700"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Сообщения */}
                    <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 bg-[#050a18]">
                      {messages.map(msg => (
                        <div key={msg._id || msg.id} className={`flex ${msg.senderId === 'manager' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex items-end gap-1 max-w-[85%] ${msg.senderId === 'manager' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {renderChatMessageAvatar(msg.senderId === 'manager', chats.find(c => c.chatId === activeId)?.userEmail)}
                            <div className={`min-w-0 px-2.5 py-1.5 rounded-2xl text-[12px] ${
                              msg.senderId === 'manager'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white/10 text-white rounded-bl-none'
                            } shadow-sm ${selectedMessages.has(msg._id || msg.id) ? 'ring-2 ring-blue-400' : ''}`}
                              onMouseDown={() => handleMessageMouseDown(msg)}
                              onMouseUp={handleMessageMouseUp}
                              onMouseLeave={handleMessageMouseUp}
                              onTouchStart={() => handleMessageMouseDown(msg)}
                              onTouchEnd={handleMessageMouseUp}
                            >
                            {msg.isUploading ? (
                              <div className="flex items-center space-x-2">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {msg.fileName && (
                                  <div className="mb-0.5">
                                    <div className={`rounded-lg overflow-hidden cursor-pointer transition-colors ${msg.senderId === 'manager' ? 'bg-black/20' : 'bg-white/5'} hover:bg-white/10`}
                                         onClick={() => window.open(msg.fileUrl ? getAbsoluteFileUrl(msg.fileUrl) : '', '_blank')}>
                                      {msg.fileType?.startsWith('image/') ? (
                                        <img src={getAbsoluteFileUrl(msg.fileUrl)} alt={msg.fileName} className="max-w-[80px] sm:max-w-[120px] h-auto object-contain" />
                                      ) : (
                                        <div className="flex items-center gap-1.5 p-1.5 text-[10px]">
                                          <FileText className="w-3 h-3 text-blue-400 shrink-0" />
                                          <span className="truncate max-w-[60px] sm:max-w-[80px]">{msg.fileName}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {(!msg.fileName || (msg.text && !msg.text.startsWith('📎'))) && (() => {
                                  const text = String(msg.text || '');
                                  if (text.startsWith('↩️ ') && text.includes('\n')) {
                                    const [head, ...rest] = text.split('\n');
                                    const body = rest.join('\n').trim();
                                    return (
                                      <div className="flex flex-col gap-1">
                                        <div className="border-l-2 border-white/30 pl-2 text-[11px] text-white/80 line-clamp-2">
                                          {head.replace(/^↩️\s*/, '')}
                                        </div>
                                        {body ? (
                                          <span className="whitespace-pre-wrap break-words leading-tight">{body}</span>
                                        ) : null}
                                      </div>
                                    );
                                  }
                                  return <span className="whitespace-pre-wrap break-words leading-tight">{text}</span>;
                                })()}
                                <div className={`text-[8px] mt-0.5 ${msg.senderId === 'manager' ? 'text-blue-100/60' : 'text-white/40'} text-right`}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Поле ввода */}
                    <div className="p-2 sm:p-3 border-t border-white/10 bg-[#050a18]">
                      {contextMenuMsg && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setContextMenuMsg(null)} />
                          <div className="relative w-full max-w-[280px] bg-[#050a18] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="p-3 border-b border-white/5 bg-white/5">
                              <p className="text-[11px] text-gray-400 truncate">
                                {contextMenuMsg.text || 'Медиафайл'}
                              </p>
                            </div>
                            <div className="grid grid-cols-1">
                              <button
                                onClick={() => {
                                  setReplyToMsg(contextMenuMsg);
                                  setContextMenuMsg(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                              >
                                <Reply className="w-4 h-4 text-blue-400" />
                                <span>Ответить</span>
                              </button>
                              <button
                                onClick={() => {
                                  setPinnedMessage(contextMenuMsg);
                                  setContextMenuMsg(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                              >
                                <Pin className="w-4 h-4 text-blue-400" />
                                <span>Закрепить</span>
                              </button>
                              <button
                                onClick={() => {
                                  const msgId = contextMenuMsg._id || contextMenuMsg.id;
                                  setSelectedMessages(prev => new Set(prev).add(msgId));
                                  setContextMenuMsg(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                              >
                                <CheckSquare className="w-4 h-4 text-blue-400" />
                                <span>Выбрать</span>
                              </button>
                              <button
                                onClick={async () => {
                                  const msgId = contextMenuMsg._id || contextMenuMsg.id;
                                  await handleDeleteMessage(msgId);
                                  setContextMenuMsg(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Удалить</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {replyToMsg && (
                        <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[11px] text-blue-300">
                              <Reply className="w-3.5 h-3.5" />
                              <span>Ответ</span>
                            </div>
                            <div className="mt-0.5 text-[12px] text-white/80 truncate">
                              {String(replyToMsg.text || replyToMsg.fileName || 'Сообщение').replace(/\s+/g, ' ').trim()}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReplyToMsg(null)}
                            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                            title="Отменить"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-blue-400 hover:bg-white/5 rounded-full shrink-0"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setShowScriptMenu(true)}
                          disabled={!activeId}
                          className="p-2 text-purple-400 hover:bg-white/5 rounded-full shrink-0 disabled:opacity-30"
                          title="Скрипты"
                        >
                          <Code className="w-5 h-5" />
                        </button>
                        <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Aa"
                          className="flex-1 px-4 py-1.5 bg-white/10 rounded-full border-none text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-[14px] leading-tight min-h-[36px] max-h-[100px]"
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              executeSend();
                            }
                          }}
                        />
                        <button
                          onClick={() => executeSend()}
                          disabled={!inputText.trim() || !activeId || uploading}
                          className="p-2 text-blue-400 hover:bg-white/5 rounded-full shrink-0 disabled:opacity-30"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                      {/* Меню скриптов */}
                      {showScriptMenu && (
                        <>
                          <div className="lg:hidden">
                            <div
                              className="fixed inset-0 bg-black/70 backdrop-blur-[1px] z-[110]"
                              onClick={() => {
                                setShowScriptMenu(false);
                                setScriptSearch('');
                              }}
                            />
                            <div className="fixed inset-x-0 bottom-0 z-[120] bg-[#050a18]/95 border-t border-white/10 rounded-t-2xl p-4">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-white">Быстрые ответы</div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowScriptMenu(false);
                                    setScriptSearch('');
                                  }}
                                  className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                                  aria-label="Закрыть"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>

                              <div className="mt-3">
                                <input
                                  value={scriptSearch}
                                  onChange={(e) => setScriptSearch(e.target.value)}
                                  placeholder="Поиск по скриптам..."
                                  className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                                />
                              </div>

                              <div className="mt-3 max-h-[50vh] overflow-y-auto space-y-2">
                                {(scripts || [])
                                  .filter((s) => {
                                    const q = scriptSearch.trim().toLowerCase();
                                    if (!q) return true;
                                    return (
                                      String(s?.title || '').toLowerCase().includes(q) ||
                                      String(s?.text || '').toLowerCase().includes(q)
                                    );
                                  })
                                  .map((script) => (
                                    <button
                                      type="button"
                                      key={script.id}
                                      onClick={() => handleSendScript(script)}
                                      className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-2xl active:scale-[0.99] transition"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="text-base font-semibold text-white truncate">{script.title}</div>
                                          {String(script.text || '').trim() ? (
                                            <div className="mt-1 text-sm text-white/60 line-clamp-2">{script.text}</div>
                                          ) : (
                                            <div className="mt-1 text-sm text-white/40">Без текста</div>
                                          )}
                                          {(script.files || []).length > 0 && (
                                            <div className="mt-1 text-[11px] text-white/60">Вложения: {(script.files || []).length}</div>
                                          )}
                                        </div>
                                        <div className="shrink-0 text-xs text-blue-300/80">Отправить</div>
                                      </div>
                                    </button>
                                  ))}

                                {(scripts || []).length === 0 && (
                                  <div className="py-8 text-center text-sm text-white/60">
                                    Нет скриптов
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="hidden lg:block absolute bottom-full left-0 mb-2 w-64 bg-white/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-[120]">
                            <div className="p-2">
                              <div className="text-xs font-medium text-gray-600 px-2 py-1">Быстрые ответы</div>
                              {scripts.map(script => (
                                <button
                                  type="button"
                                  key={script.id}
                                  onClick={() => handleSendScript(script)}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded transition-colors"
                                >
                                  <div className="font-medium">{script.title}</div>
                                  <div className="text-xs text-gray-500 truncate">{script.text}</div>
                                  {(script.files || []).length > 0 && (
                                    <div className="text-[10px] text-gray-500">Вложения: {(script.files || []).length}</div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                  </>
                ) : (
                    <div className="hidden lg:flex flex-1 items-center justify-center">
                      <div className="text-center">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400">Выберите чат для начала общения</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Заказы */}
          {activeSection === 'orders' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <h2 className="text-lg sm:text-2xl font-bold text-white">Управление заказами</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    className="bg-slate-900/80 border border-white/20 rounded-lg px-3 py-2 text-sm sm:text-base sm:px-4 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option className="bg-slate-900 text-white" value="all">Все заказы</option>
                    <option className="bg-slate-900 text-white" value="new">Новые</option>
                    <option className="bg-slate-900 text-white" value="accepted">Принятые</option>
                    <option className="bg-slate-900 text-white" value="declined">Отклоненные</option>
                  </select>
                  <input
                    value={ordersSearchQuery}
                    onChange={(e) => setOrdersSearchQuery(e.target.value)}
                    placeholder="Поиск заказов..."
                    className="bg-slate-900/80 border border-white/20 rounded-lg px-3 py-2 text-sm sm:text-base sm:px-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-stretch gap-2">
                    <button
                      onClick={() => {
                        const list = selectedOrdersUserKey ? (ordersByUser.get(selectedOrdersUserKey)?.orders || []) : filteredOrders;
                        downloadOrdersList(list, 'json');
                      }}
                      className={`px-3 py-2 sm:px-4 rounded-lg text-white font-medium flex items-center justify-center space-x-2 text-sm sm:text-base ${brandGradient}`}
                    >
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>JSON</span>
                    </button>
                    <button
                      onClick={() => {
                        const list = selectedOrdersUserKey ? (ordersByUser.get(selectedOrdersUserKey)?.orders || []) : filteredOrders;
                        downloadOrdersPdf(list);
                      }}
                      className="px-3 py-2 sm:px-4 border border-white/20 rounded-lg text-white hover:bg-white/5 font-medium text-sm sm:text-base"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-[60vh] lg:h-[calc(100vh-8rem)] overflow-hidden">
                <div className={`${mobileOrdersListOpen ? 'flex' : 'hidden'} lg:flex lg:flex-none lg:w-80 flex-col bg-[#050a18] lg:bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex-1`}>
                  <div className="p-3 border-b border-white/10">
                    <h2 className="text-base sm:text-lg font-bold text-white">Клиенты</h2>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {orderUsers.length} {orderUsers.length === 1 ? 'клиент' : orderUsers.length > 1 && orderUsers.length < 5 ? 'клиента' : 'клиентов'}
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {orderUsers.map((ou) => (
                      <div
                        key={ou.key}
                        onClick={() => {
                          setSelectedOrdersUserKey(ou.key);
                          setMobileOrdersListOpen(false);
                        }}
                        className={`p-2.5 sm:p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                          selectedOrdersUserKey === ou.key ? 'bg-blue-600/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <UserAvatar
                          email={ou.email}
                          name={ou.name}
                          size="w-9 h-9 sm:w-10 sm:h-10"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] sm:text-sm font-semibold text-white truncate">{ou.name}</div>
                          <div className="text-[11px] sm:text-xs text-gray-400 truncate">{ou.email || 'Без email'}</div>
                        </div>
                        <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded-full border ${
                          ou.unseenCount > 0
                            ? 'bg-yellow-500/15 border-yellow-500/25 text-yellow-300'
                            : 'bg-white/5 border-white/10 text-white/80'
                        }`}>
                          {ou.unseenCount > 0 ? ou.unseenCount : ou.count}
                        </span>
                      </div>
                    ))}
                    {orderUsers.length === 0 && (
                      <div className="text-center py-10">
                        <Package className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                        <p className="text-gray-400 text-sm">Заказы не найдены</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`flex-1 bg-[#050a18] lg:bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden ${selectedOrdersUserKey && !mobileOrdersListOpen ? 'flex flex-col' : 'hidden lg:flex flex-col'}`}>
                  {selectedOrdersUserKey ? (
                    <>
                      <div className="p-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => setMobileOrdersListOpen(true)}
                            className="lg:hidden p-2 rounded-full text-white hover:bg-white/5"
                            title="Назад"
                            type="button"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <UserAvatar
                            email={ordersByUser.get(selectedOrdersUserKey)?.email}
                            name={ordersByUser.get(selectedOrdersUserKey)?.name}
                            size="w-9 h-9 sm:w-10 sm:h-10"
                          />
                          <div className="min-w-0">
                            <div className="text-sm sm:text-base font-semibold text-white truncate">
                              {ordersByUser.get(selectedOrdersUserKey)?.name || 'Клиент'}
                            </div>
                            <div className="text-[11px] sm:text-xs text-gray-400 truncate">
                              {ordersByUser.get(selectedOrdersUserKey)?.email || ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-white/70">
                          {(ordersByUser.get(selectedOrdersUserKey)?.orders || []).length} заказ(ов)
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="flex flex-col gap-4">
                          {(ordersByUser.get(selectedOrdersUserKey)?.orders || []).map((order, idx) => (
                            <div
                              key={`${order.chatId}-${order.orderIndex}-${idx}`}
                              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 w-full"
                              onClick={() => markOrderSeen(order)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') markOrderSeen(order);
                              }}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                <div className="flex items-center justify-between sm:justify-start gap-3">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    order.status === 'new' ? 'bg-yellow-500/20 text-yellow-400' :
                                    order.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {order.status === 'new' ? 'Новый' :
                                     order.status === 'accepted' ? 'Принят' : 'Отклонен'}
                                  </span>

                                  <span className={`px-2 py-1 text-xs rounded-full border ${
                                    seenOrders.includes(getOrderKey(order))
                                      ? 'border-green-500/30 text-green-300 bg-green-500/10'
                                      : 'border-yellow-500/30 text-yellow-300 bg-yellow-500/10'
                                  }`}>
                                    {seenOrders.includes(getOrderKey(order)) ? 'Просмотрено' : 'Не просмотрено'}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-end">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openChatWithOrder(order);
                                    }}
                                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-white border border-blue-400/30 hover:bg-blue-500/10 transition-colors text-[11px] sm:text-xs"
                                    title="Связаться с клиентом"
                                    type="button"
                                  >
                                    Связаться
                                  </button>
                                  <select
                                    value={order.status || 'new'}
                                    onChange={(e) => handleUpdateOrderStatus(order.chatId, order.orderIndex, e.target.value)}
                                    className="bg-slate-900/80 border border-white/20 rounded-lg px-2.5 py-1.5 sm:px-2 sm:py-1 text-white text-[11px] sm:text-xs focus:outline-none focus:border-blue-500"
                                    title="Статус заказа"
                                  >
                                    <option className="bg-slate-900 text-white" value="new">Новый</option>
                                    <option className="bg-slate-900 text-white" value="accepted">Принят</option>
                                    <option className="bg-slate-900 text-white" value="declined">Отклонен</option>
                                  </select>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadOrder(order, 'json');
                                    }}
                                    className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                                    title="Скачать JSON"
                                    type="button"
                                  >
                                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadOrdersPdf([order]);
                                    }}
                                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-white border border-white/20 hover:bg-white/10 transition-colors text-[11px] sm:text-xs"
                                    title="Скачать PDF"
                                    type="button"
                                  >
                                    PDF
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOrderDetailsEditorOpen(true);
                                      setEditingOrder(order);
                                    }}
                                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-white border border-white/20 hover:bg-white/10 transition-colors text-[11px] sm:text-xs"
                                    title="Данные менеджера"
                                    type="button"
                                  >
                                    Данные
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteOrder(order.chatId, order.orderIndex);
                                    }}
                                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Удалить заказ"
                                    type="button"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-gray-400">Клиент</p>
                                  <p className="text-sm font-medium text-white">
                                    {order.firstName} {order.lastName}
                                  </p>
                                  <p className="text-xs text-gray-400">{order.contact}</p>
                                </div>

                                <div>
                                  <p className="text-xs text-gray-400">Услуги</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {order.services?.map((service, i) => (
                                      <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                                        {service}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {order.comment && (
                                  <div>
                                    <p className="text-xs text-gray-400">Комментарий</p>
                                    <p className="text-xs text-gray-300 italic">"{order.comment}"</p>
                                  </div>
                                )}

                                {order.files && order.files.length > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-400">Файлы заказа</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                      {order.files.map((file) => (
                                        <div key={file.id || file.url || file.name}>
                                          {renderOrderFile(file)}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="pt-2" />
                              </div>
                            </div>
                          ))}
                        </div>

                        {(ordersByUser.get(selectedOrdersUserKey)?.orders || []).length === 0 && (
                          <div className="text-center py-16">
                            <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                            <p className="text-gray-400">Заказы не найдены</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400">Выберите клиента, чтобы посмотреть заказы</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {orderDetailsEditorOpen && editingOrder && (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/70" onClick={() => { setOrderDetailsEditorOpen(false); setEditingOrder(null); }} />
              <div className="absolute inset-x-0 bottom-0 bg-[#050a18]/95 border-t border-white/10 rounded-t-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">
                    Данные менеджера · #{editingOrder.orderIndex}
                  </div>
                  <button
                    onClick={() => { setOrderDetailsEditorOpen(false); setEditingOrder(null); }}
                    className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-400">Дата</span>
                    <input
                      type="date"
                      value={getOrderDraft(editingOrder).managerDate}
                      onChange={(e) => setOrderDraftField(editingOrder, 'managerDate', e.target.value)}
                      className="px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-400">Цена (₾)</span>
                    <input
                      type="number"
                      value={getOrderDraft(editingOrder).priceGel}
                      onChange={(e) => setOrderDraftField(editingOrder, 'priceGel', e.target.value)}
                      className="px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-400">Цена ($)</span>
                    <input
                      type="number"
                      value={getOrderDraft(editingOrder).priceUsd}
                      onChange={(e) => setOrderDraftField(editingOrder, 'priceUsd', e.target.value)}
                      className="px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-400">Цена (€)</span>
                    <input
                      type="number"
                      value={getOrderDraft(editingOrder).priceEur}
                      onChange={(e) => setOrderDraftField(editingOrder, 'priceEur', e.target.value)}
                      className="px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <span className="text-[11px] text-gray-400">Комментарий менеджера</span>
                    <textarea
                      rows={4}
                      value={getOrderDraft(editingOrder).managerComment}
                      onChange={(e) => setOrderDraftField(editingOrder, 'managerComment', e.target.value)}
                      className="px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      handleSaveOrderDetails(editingOrder);
                      setOrderDetailsEditorOpen(false);
                      setEditingOrder(null);
                    }}
                    className={`px-4 py-3 rounded-xl ${brandGradient} text-white font-medium`}
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={async () => {
                      await ordersAPI.deleteDetails(editingOrder.chatId, editingOrder.orderIndex);
                      loadOrders();
                      setOrderDetailsEditorOpen(false);
                      setEditingOrder(null);
                    }}
                    className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-red-300 hover:bg-white/10"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Скрипты */}
          {activeSection === 'scripts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-2xl font-bold text-white">Быстрые ответы</h2>
                <button
                  onClick={openNewScript}
                  className={`px-4 py-2 ${brandGradient} rounded-lg text-white font-medium flex items-center space-x-2 w-full sm:w-auto justify-center`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить скрипт</span>
                </button>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="text-white/90">Конструктор документа для подписи</div>
                  <button
                    onClick={() => setSignatureComposerOpen(true)}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15"
                  >
                    Открыть конструктор
                  </button>
                </div>
              </div>

              <div className="lg:hidden">
                <div className="space-y-3">
                  {(scripts || []).map((script) => {
                    const isSig = isSignatureScript(script);
                    const payload = isSig ? parseSignatureScript(script) : null;
                    const fileUrl = payload?.file?.url ? filesAPI.getFileUrl(payload.file.url) : '';
                    const isPdf = isSig && (String(payload?.file?.type || '').includes('pdf') || String(fileUrl).toLowerCase().endsWith('.pdf'));
                    const isImage = isSig && String(payload?.file?.type || '').startsWith('image/');
                    return (
                      <div key={script.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 w-full">
                            <div className="text-base font-semibold text-white truncate">{script.title}</div>
                            {!isSig ? (
                              <>
                                {String(script.text || '').trim() ? (
                                  <div className="mt-1 text-sm text-white/60 line-clamp-2">{script.text}</div>
                                ) : (
                                  <div className="mt-1 text-sm text-white/40">Без текста</div>
                                )}
                                {(script.files || []).length > 0 && (
                                  <div className="mt-2 text-xs text-white/70">Вложения: {(script.files || []).length}</div>
                                )}
                              </>
                            ) : (
                              <div className="mt-2 space-y-2">
                                <div className="text-xs text-white/70">Шаблон подписи</div>
                                <div className="bg-white/5 border border-white/10 rounded p-2">
                                  {isPdf ? (
                                    <iframe title="doc" src={fileUrl} className="w-full h-48 bg-white rounded" />
                                  ) : isImage ? (
                                    <img alt="doc" src={fileUrl} className="max-w-full rounded bg-white" />
                                  ) : (
                                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-300 underline">Открыть документ</a>
                                  )}
                                </div>
                                {/* отправка только через чат; кнопки нет */}
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              onClick={() => openEditScript(script)}
                              className="p-2 rounded-xl bg-white/5 border border-white/10 text-blue-300 hover:bg-white/10"
                              aria-label="Редактировать"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteScript(script.id)}
                              className="p-2 rounded-xl bg-white/5 border border-white/10 text-red-300 hover:bg-white/10"
                              aria-label="Удалить"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {(scripts || []).length === 0 && (
                    <div className="text-center py-10 text-white/60">
                      Скриптов пока нет
                    </div>
                  )}
                </div>

                {scriptEditorOpen && (
                  <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/70" onClick={closeScriptEditor} />
                    <div className="absolute inset-x-0 bottom-0 bg-[#050a18]/95 border-t border-white/10 rounded-t-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">
                          {editingScriptId ? 'Редактировать скрипт' : 'Новый скрипт'}
                        </div>
                        <button
                          onClick={closeScriptEditor}
                          className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                          aria-label="Закрыть"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        <input
                          type="text"
                          value={newScript.title}
                          onChange={(e) => setNewScript({ ...newScript, title: e.target.value })}
                          placeholder="Название"
                          className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                        />
                        <textarea
                          value={newScript.text}
                          onChange={(e) => setNewScript({ ...newScript, text: e.target.value })}
                          placeholder="Текст ответа..."
                          rows={4}
                          className="w-full px-4 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 resize-none"
                        />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-white/70">Вложения</div>
                            <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 ${scriptFilesUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                              <Paperclip className="w-4 h-4" />
                              <span className="text-xs">{scriptFilesUploading ? 'Загрузка...' : 'Добавить файлы'}</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                                onChange={handleScriptFilesSelect}
                                className="hidden"
                              />
                            </label>
                          </div>
                          {(newScript.files || []).length > 0 && (
                            <div className="flex flex-col gap-2">
                              {(newScript.files || []).map((f, idx) => (
                                <div key={`${f.url}-${idx}`} className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                                  <div className="min-w-0">
                                    <div className="text-xs text-white truncate">{f.name}</div>
                                    <div className="text-[10px] text-white/50 truncate">{f.type || 'file'}</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeScriptFile(idx)}
                                    className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                                    aria-label="Удалить вложение"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={closeScriptEditor}
                            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10"
                          >
                            Отмена
                          </button>
                          <button
                            onClick={() => {
                              const hasText = !!String(newScript.text || '').trim();
                              const hasFiles = Array.isArray(newScript.files) && newScript.files.length > 0;
                              if (!newScript.title || (!hasText && !hasFiles)) return;
                              handleSaveScript();
                              closeScriptEditor();
                            }}
                            disabled={!newScript.title || (!(String(newScript.text || '').trim()) && !((newScript.files || []).length))}
                            className={`px-4 py-3 rounded-xl ${brandGradient} text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {editingScriptId ? 'Обновить' : 'Сохранить'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Форма добавления/редактирования */}
              <div className="hidden lg:block bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {editingScriptId ? 'Редактировать скрипт' : 'Новый скрипт'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Заголовок</label>
                    <input
                      type="text"
                      value={newScript.title}
                      onChange={(e) => setNewScript({...newScript, title: e.target.value})}
                      placeholder="Название скрипта"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Текст ответа</label>
                    <textarea
                      value={newScript.text}
                      onChange={(e) => setNewScript({...newScript, text: e.target.value})}
                      placeholder="Текст быстрого ответа..."
                      rows={3}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">Вложения</label>
                      <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 ${scriptFilesUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                        <Paperclip className="w-4 h-4" />
                        <span className="text-sm">{scriptFilesUploading ? 'Загрузка...' : 'Добавить файлы'}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                          onChange={handleScriptFilesSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {(newScript.files || []).length > 0 && (
                      <div className="space-y-2">
                        {(newScript.files || []).map((f, idx) => (
                          <div key={`${f.url}-${idx}`} className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                            <div className="min-w-0">
                              <div className="text-sm text-white truncate">{f.name}</div>
                              <div className="text-xs text-white/50 truncate">{f.type || 'file'}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeScriptFile(idx)}
                              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                              title="Удалить"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleSaveScript}
                      disabled={!newScript.title || (!(String(newScript.text || '').trim()) && !((newScript.files || []).length))}
                      className={`px-4 py-2 ${brandGradient} rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto`}
                    >
                      {editingScriptId ? 'Обновить' : 'Сохранить'}
                    </button>
                    {editingScriptId && (
                      <button
                        onClick={() => {
                          setEditingScriptId(null);
                          setNewScript({ title: '', text: '', files: [] });
                        }}
                        className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 w-full sm:w-auto"
                      >
                        Отмена
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Список скриптов */}
              <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-4">
                {scripts.map(script => {
                  const isSig = isSignatureScript(script);
                  const payload = isSig ? parseSignatureScript(script) : null;
                  const fileUrl = payload?.file?.url ? filesAPI.getFileUrl(payload.file.url) : '';
                  const isPdf = isSig && (String(payload?.file?.type || '').includes('pdf') || String(fileUrl).toLowerCase().endsWith('.pdf'));
                  const isImage = isSig && String(payload?.file?.type || '').startsWith('image/');
                  return (
                    <div key={script.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-white">{script.title}</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditScript(script)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteScript(script.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {!isSig ? (
                        <div className="space-y-2">
                          {String(script.text || '').trim() ? (
                            <p className="text-sm text-gray-300">{script.text}</p>
                          ) : (
                            <p className="text-sm text-gray-500">Без текста</p>
                          )}
                          {(script.files || []).length > 0 && (
                            <div className="text-xs text-gray-400">Вложения: {(script.files || []).length}</div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-xs text-white/70">Шаблон подписи</div>
                          <div className="bg-white/5 border border-white/10 rounded p-2">
                            {isPdf ? (
                              <iframe title="doc" src={fileUrl} className="w-full h-56 bg-white rounded" />
                            ) : isImage ? (
                              <img alt="doc" src={fileUrl} className="max-w-full rounded bg-white" />
                            ) : (
                              <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-300 underline">Открыть документ</a>
                            )}
                          </div>
                          {/* отправка только через чат; кнопки нет */}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {signatureComposerOpen && (
            <SignatureRequestComposer
              chatId={activeId}
              onClose={() => setSignatureComposerOpen(false)}
              onSaveToScripts={({ title, text }) => {
                const id = String(Date.now());
                const next = [{ id, title, text }, ...scripts];
                setScripts(next);
                setSignatureComposerOpen(false);
                alert('Сохранено в быстрые скрипты');
              }}
              onSent={async () => {
                setSignatureComposerOpen(false);
                setActiveSection('chats');
              }}
            />
          )}

          {/* Управление сайтом */}
          {activeSection === 'site' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Управление сайтом</h2>

              {/* Редактирование контента */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Основной контент</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Главный заголовок</label>
                    <input
                      type="text"
                      value={siteContent.heroTitle}
                      onChange={(e) => setSiteContent({...siteContent, heroTitle: e.target.value})}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Описание</label>
                    <textarea
                      value={siteContent.heroDescription}
                      onChange={(e) => setSiteContent({...siteContent, heroDescription: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveSiteContent}
                    className={`px-4 py-2 ${brandGradient} rounded-lg text-white font-medium w-full sm:w-auto`}
                  >
                    Сохранить контент
                  </button>
                </div>
              </div>

              {/* Управление услугами */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-white">Услуги</h3>
                  <button
                    onClick={handleAddService}
                    className={`px-4 py-2 ${brandGradient} rounded-lg text-white font-medium flex items-center space-x-2 w-full sm:w-auto justify-center`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить услугу</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {services.map(service => (
                    <div key={service.id} className="bg-white/5 rounded-lg p-4">
                      {editingService?.id === service.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editingService.name}
                            onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                          />
                          <input
                            type="text"
                            value={editingService.description}
                            onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveService}
                              className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingService(null)}
                              className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white">{service.name}</h4>
                            <p className="text-sm text-gray-400">{service.description}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingService(service)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO настройки */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">SEO настройки</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Meta Title</label>
                    <input
                      type="text"
                      value={siteContent.metaTitle}
                      onChange={(e) => setSiteContent({...siteContent, metaTitle: e.target.value})}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Meta Description</label>
                    <textarea
                      value={siteContent.metaDescription}
                      onChange={(e) => setSiteContent({...siteContent, metaDescription: e.target.value})}
                      rows={2}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Настройки */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Настройки системы</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Общие настройки */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Общие настройки</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Уведомления</span>
                      <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Автосохранение</span>
                      <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Темная тема</span>
                      <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                        <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Безопасность */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Безопасность</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Смена пароля</label>
                      <input
                        type="password"
                        placeholder="Новый пароль"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="Подтвердите пароль"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button className={`w-full py-2 ${brandGradient} rounded-lg text-white font-medium`}>
                      Обновить пароль
                    </button>
                  </div>
                </div>

                {/* Резервное копирование */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Резервное копирование</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-400">Последнее копирование: 2 часа назад</p>
                    </div>
                    <button className={`w-full py-2 ${brandGradient} rounded-lg text-white font-medium`}>
                      Создать резервную копию
                    </button>
                    <button className="w-full py-2 border border-white/20 rounded-lg text-white hover:bg-white/5">
                      Скачать последнюю копию
                    </button>
                  </div>
                </div>

                {/* Система */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Система</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Версия</span>
                      <span className="text-sm text-white">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">База данных</span>
                      <span className="text-sm text-green-400">Подключена</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Socket.io</span>
                      <span className="text-sm text-green-400">Активен</span>
                    </div>
                    <button className="w-full py-2 border border-white/20 rounded-lg text-white hover:bg-white/5">
                      Перезагрузить систему
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Остальные разделы - заглушки */}
          {activeSection !== 'dashboard' && activeSection !== 'clients' && 
           activeSection !== 'chats' && activeSection !== 'orders' && 
           activeSection !== 'scripts' && activeSection !== 'site' && 
           activeSection !== 'settings' && (
            <div className="text-center py-16">
              <div className={`w-20 h-20 rounded-xl ${brandGradient} flex items-center justify-center mx-auto mb-4`}>
                {navItems.find(item => item.id === activeSection)?.icon && 
                  React.createElement(navItems.find(item => item.id === activeSection).icon, { className: "w-10 h-10 text-white" })
                }
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {navItems.find(item => item.id === activeSection)?.label}
              </h3>
              <p className="text-gray-400"></p>
            </div>
          )}
        </div>
      </main>
      
      {showInstallModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowInstallModal(false)} />
          <div className="relative w-full max-w-[420px] bg-[#0a0a0a] border border-blue-500/20 rounded-2xl p-6 shadow-2xl">
            <div className="text-white text-sm font-bold uppercase tracking-widest">
              {t('INSTALL_APP')}
            </div>
            <div className="mt-3 text-white/70 text-sm leading-relaxed">
              {t('INSTALL_APP_DESC')}
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 transition-colors"
              >
                {t('CANCEL')}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden">
        <div className="bg-[#050a18]/95 backdrop-blur-md border-t border-white/10">
          <div className="max-w-7xl mx-auto px-2 py-1.5 grid grid-cols-4 gap-1">
            {['dashboard','chats','orders','clients'].map((id) => {
              const item = navItems.find(i => i.id === id);
              const Icon = item.icon;
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  onClick={() => { setActiveSection(id); setMobileMenuOpen(false); }}
                  className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30'
                      : 'text-gray-200 hover:text-white hover:bg-white/5 border border-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {id === 'chats' && unreadMessagesCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-600 text-white text-[8px]">
                      {unreadMessagesCount}
                    </span>
                  )}
                  {id === 'orders' && unseenNewOrdersCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-yellow-500 text-black text-[8px]">
                      {unseenNewOrdersCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagerPanelPro;
