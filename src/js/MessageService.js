import { ajax } from 'rxjs/ajax';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export class MessageService {
    constructor(baseUrl = '/messages/unread') {
        this.baseUrl = baseUrl;
    }

    fetchMessages() {
        return ajax.getJSON(this.baseUrl).pipe(
            map(response => {
                if (!response || response.status !== 'ok') {
                    throw new Error('Некорректный ответ сервера');
                }
                return response.messages || [];
            }),
            catchError(error => {
                console.error('Ошибка при получении сообщений:', error);
                throw error;
            })
        );
    }

    processNewMessages(currentMessages, newMessages) {
        if (!newMessages || !Array.isArray(newMessages)) {
            return { newMessages: [], updatedMessages: currentMessages };
        }

        const existingMessagesMap = new Map(currentMessages.map(msg => [msg.id, msg]));
        const uniqueNewMessages = newMessages.filter(msg => !existingMessagesMap.has(msg.id));

        if (uniqueNewMessages.length === 0) {
            return { newMessages: [], updatedMessages: currentMessages };
        }

        const updatedMessages = [...uniqueNewMessages.map(msg => ({
            ...msg,
            isNew: true
        })), ...currentMessages];

        if (updatedMessages.length > 100) {
            updatedMessages.splice(100);
        }

        updatedMessages.forEach((msg, index) => {
            if (index >= 3 && msg.isNew) {
                msg.isNew = false;
            }
        });

        return {
            newMessages: uniqueNewMessages,
            updatedMessages
        };
    }
}