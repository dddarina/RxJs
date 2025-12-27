import { interval, merge, of, Subject } from 'rxjs';
import { switchMap, catchError, startWith, takeUntil, filter, distinctUntilChanged } from 'rxjs/operators';

import { setLoading, setError } from './utils.js';
import { cleanupModal } from './modal.js';
import { showMessageModal } from './modal.js';

import { MessageService } from './MessageService.js';
import { MessageRenderer } from './MessageRenderer.js';
import { EventManager } from './EventManager.js';

class MessageWidget {
    constructor(baseUrl = '/messages/unread') {
        this.messages = [];
        this.destroy$ = new Subject();
        this.pollingInterval = 10000;
        this.isDestroyed = false;
        this.baseUrl = baseUrl;

        this.messageService = new MessageService(baseUrl);
        this.messageRenderer = null;
        this.eventManager = null;

        this.init();
    }

    init() {
        this.cacheElements();
        this.initializeServices();
        this.setupEventStreams();
    }

    cacheElements() {
        this.elements = {
            messagesBody: document.getElementById('messages-body'),
            refreshBtn: document.getElementById('refresh-now'),
            retryBtn: document.getElementById('retry-btn'),
            autoRefresh: document.getElementById('auto-refresh'),
            intervalSelect: document.getElementById('interval-select'),
            currentInterval: document.getElementById('current-interval'),
            errorContainer: document.getElementById('error-container')
        };
    }

    initializeServices() {
        this.messageRenderer = new MessageRenderer(this.elements);
        this.eventManager = new EventManager(this.elements);
        
        this.setupEventListeners();
    }

    setupEventStreams() {
        if (!this.elements.refreshBtn) return;

        this.destroy$.next();

        const manualRefresh$ = this.eventManager.getRefreshStream()?.pipe(
            startWith(null)
        ) || of(null);

        const autoRefresh$ = interval(this.pollingInterval).pipe(
            filter(() => {
                const autoRefresh = this.elements.autoRefresh;
                return autoRefresh ? autoRefresh.checked : true;
            })
        );

        const refresh$ = merge(manualRefresh$, autoRefresh$).pipe(
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        );

        const messages$ = refresh$.pipe(
            switchMap(() => {
                setLoading(true);
                return this.messageService.fetchMessages().pipe(
                    catchError(error => {
                        this.handleFetchError(error);
                        return of([]);
                    })
                );
            }),
            takeUntil(this.destroy$)
        );

        this.messagesSubscription = messages$.subscribe({
            next: messages => this.handleNewMessages(messages),
            error: error => this.handleStreamError(error),
            complete: () => console.log('Поток сообщений завершен')
        });
    }

    handleNewMessages(newMessages) {
        if (this.isDestroyed) return;

        setLoading(false);

        const result = this.messageService.processNewMessages(this.messages, newMessages);
        
        if (result.newMessages.length > 0) {
            this.messages = result.updatedMessages;
            this.messageRenderer.renderMessages(this.messages);
        }

        this.messageRenderer.updateStatsDisplay(this.messages.length, result.newMessages.length);
    }

    handleFetchError(error) {
        console.error('Ошибка при получении сообщений:', error);
        setError(true);
        this.messageRenderer.showError('Не удалось загрузить сообщения', this.elements.errorContainer);
        setLoading(false);
    }

    setupEventListeners() {
        this.eventManager.setupMessageClickHandler((messageId) => {
            const message = this.messages.find(m => m.id === messageId);
            if (message) {
                showMessageModal(message);
            }
        });

        this.eventManager.setupRefreshControls(
            (interval) => {
                this.pollingInterval = interval;
                this.setupEventStreams();
            },
            () => {
                this.setupEventStreams();
            }
        );

        this.eventManager.setupRetryHandler(() => {
            if (this.elements.refreshBtn) {
                this.elements.refreshBtn.click();
            }
        });
    }

    handleStreamError(error) {
        this.messageRenderer.showError('Произошла критическая ошибка. Попробуйте обновить страницу.', this.elements.errorContainer);
    }

    destroy() {
        this.isDestroyed = true;

        if (this.messagesSubscription) {
            this.messagesSubscription.unsubscribe();
        }

        this.destroy$.next();
        this.destroy$.complete();

        if (this.eventManager) {
            this.eventManager.cleanup();
        }

        cleanupModal();

        this.messages = [];
        this.elements = null;
        this.messageRenderer = null;
        this.eventManager = null;

        console.log('MessageWidget уничтожен');
    }
}

export { MessageWidget };