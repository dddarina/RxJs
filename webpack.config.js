const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 8080,
    hot: true,
    historyApiFallback: true,
    setupMiddlewares: (middlewares, devServer) => {
      let allMessages = [];
      let messageCounter = 0;
      let addMessageInterval = null;

      function generateUniqueId() {
        return `msg_${Date.now()}_${messageCounter++}_${Math.random().toString(36).substr(2, 9)}`;
      }

      function generateEmail() {
        const names = ['anna', 'alex', 'maria', 'dmitry', 'ekaterina', 'ivan', 'olga'];
        const domains = ['company.com', 'corp.ru', 'mail.org', 'business.net'];
        const name = names[Math.floor(Math.random() * names.length)];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        return `${name}@${domain}`;
      }

      function generateSubject() {
        const subjects = [
          'Срочно: требуется ваше подтверждение',
          'Обсуждение нового функционала',
          'Еженедельный отчет',
          'Встреча по планированию',
          'Обновление политики безопасности',
          'Вопрос по бюджету',
          'Результаты тестирования',
          'Приглашение на мероприятие'
        ];
        return subjects[Math.floor(Math.random() * subjects.length)];
      }

      function generateBody() {
        const bodies = [
          'Прошу ознакомиться с приложенным документом.',
          'Требуется ваше участие в обсуждении.',
          'Направляю вам материалы для подготовки.',
          'Прошу предоставить информацию по текущему статусу.'
        ];
        return bodies[Math.floor(Math.random() * bodies.length)];
      }

      function addNewMessage() {
        const newMessage = {
          id: generateUniqueId(),
          from: generateEmail(),
          subject: generateSubject(),
          body: generateBody(),
          received: Math.floor(Date.now() / 1000)
        };

        allMessages.unshift(newMessage);

        if (allMessages.length > 50) {
          allMessages = allMessages.slice(0, 50);
        }

        return newMessage;
      }

      console.log('Создаем начальные сообщения...');
      const initialCount = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < initialCount; i++) {
        const message = {
          id: generateUniqueId(),
          from: generateEmail(),
          subject: generateSubject(),
          body: generateBody(),
          received: Math.floor(Date.now() / 1000) - i * 60
        };
        allMessages.push(message);
      }

      allMessages.sort((a, b) => b.received - a.received);

      allMessages.slice(0, 3).forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg.id.substring(0, 30)}...`);
      });

      function startAddingMessages() {
        if (addMessageInterval) clearInterval(addMessageInterval);

        addMessageInterval = setInterval(() => {
          if (Math.random() > 0.4) {
            addNewMessage();
          }
        }, 8000 + Math.random() * 7000);
      }

      startAddingMessages();

      setInterval(() => {
        startAddingMessages();
      }, 60000);

      devServer.app.get('/messages/unread', (req, res) => {
        console.log(`📡 [${new Date().toLocaleTimeString()}] Запрос /messages/unread`);

        // Только 1-3 последних сообщения
        const messageCount = Math.min(allMessages.length, 3);
        const recentMessages = allMessages.slice(0, messageCount);

        const response = {
          status: 'ok',
          timestamp: Math.floor(Date.now() / 1000),
          messages: recentMessages
        };

        res.json(response);
      });

      return middlewares;
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/css',
          to: 'css'
        }
      ]
    })
  ]
};