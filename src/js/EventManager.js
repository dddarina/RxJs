import { fromEvent } from 'rxjs';
import { tap } from 'rxjs/operators';

export class EventManager {
    constructor(elements) {
        this.elements = elements;
        this.listeners = new Map();
    }

    setupMessageClickHandler(onMessageClick) {
        if (!this.elements.messagesBody) return;

        const handler = (e) => {
            const row = e.target.closest('tr[data-message-id]');
            if (row) {
                const messageId = row.dataset.messageId;
                onMessageClick(messageId);
            }
        };

        this.elements.messagesBody.addEventListener('click', handler);
        this.listeners.set('messageClick', handler);
    }

    setupRefreshControls(onIntervalChange, onAutoRefreshChange) {
        if (this.elements.intervalSelect) {
            const intervalHandler = (e) => {
                const interval = parseInt(e.target.value) * 1000;
                onIntervalChange(interval);
                
                if (this.elements.currentInterval) {
                    this.elements.currentInterval.textContent = e.target.value;
                }
            };
            
            this.elements.intervalSelect.addEventListener('change', intervalHandler);
            this.listeners.set('intervalChange', intervalHandler);
        }

        if (this.elements.autoRefresh) {
            const autoRefreshHandler = () => {
                onAutoRefreshChange(this.elements.autoRefresh.checked);
            };
            
            this.elements.autoRefresh.addEventListener('change', autoRefreshHandler);
            this.listeners.set('autoRefreshChange', autoRefreshHandler);
        }
    }

    setupRetryHandler(onRetry) {
        if (this.elements.retryBtn) {
            const retryHandler = () => {
                onRetry();
            };
            
            this.elements.retryBtn.addEventListener('click', retryHandler);
            this.listeners.set('retryClick', retryHandler);
        }
    }

    getRefreshStream() {
        if (!this.elements.refreshBtn) return null;

        return fromEvent(this.elements.refreshBtn, 'click').pipe(
            tap(() => {
                console.log('Ручное обновление');
            })
        );
    }

    cleanup() {
        this.listeners.forEach((handler, eventName) => {
            switch (eventName) {
                case 'messageClick':
                    this.elements.messagesBody.removeEventListener('click', handler);
                    break;
                case 'intervalChange':
                    this.elements.intervalSelect.removeEventListener('change', handler);
                    break;
                case 'autoRefreshChange':
                    this.elements.autoRefresh.removeEventListener('change', handler);
                    break;
                case 'retryClick':
                    this.elements.retryBtn.removeEventListener('click', handler);
                    break;
            }
        });
        
        this.listeners.clear();
    }
}