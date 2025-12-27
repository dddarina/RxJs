import {
    createMessageRow,
    createEmptyState,
    updateStats,
    formatDate,
    truncateSubject
} from './utils.js';

export class MessageRenderer {
    constructor(elements) {
        this.elements = elements;
    }

    renderMessages(messages) {
        const messagesBody = this.elements.messagesBody;
        if (!messagesBody) return;

        const fragment = document.createDocumentFragment();

        if (messages.length === 0) {
            fragment.append(createEmptyState());
        } else {
            let newMessageCount = 0;

            messages.forEach(msg => {
                const isNew = msg.isNew === true && newMessageCount < 3;
                if (isNew) newMessageCount++;

                const formattedMsg = {
                    ...msg,
                    formattedDate: formatDate(msg.received),
                    truncatedSubject: truncateSubject(msg.subject),
                    originalSubject: msg.subject
                };

                const row = createMessageRow(formattedMsg, isNew);
                row.dataset.messageId = msg.id;
                fragment.append(row);
            });
        }

        messagesBody.innerHTML = '';
        messagesBody.appendChild(fragment);
    }

    updateStatsDisplay(messagesCount, newCount, lastUpdate) {
        const currentTime = lastUpdate || new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        updateStats(messagesCount, newCount, currentTime);
    }

    showError(message, errorContainer) {
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
        }
    }

    hideError(errorContainer) {
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }
}