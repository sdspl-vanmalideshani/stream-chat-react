import React, { useEffect, useState, useMemo } from 'react';
import {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  StreamChat,
  Event,
  TokenOrProvider,
  OwnUserResponse,
  ExtendableGenerics,
  DefaultGenerics,
  UserResponse,
} from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from 'stream-chat-react';
import '@stream-io/stream-chat-css/dist/css/index.css';
import './App.css';

const apiKey = process.env.REACT_APP_STREAM_KEY as string;
// const userId = process.env.REACT_APP_USER_ID as string;
// const userToken = process.env.REACT_APP_USER_TOKEN as string;

type LocalAttachmentType = Record<string, unknown>;
type LocalChannelType = Record<string, unknown>;
type LocalCommandType = string;
type LocalEventType = Record<string, unknown>;
type LocalMessageType = Record<string, unknown>;
type LocalReactionType = Record<string, unknown>;
type LocalUserType = Record<string, unknown>;

type StreamChatGenerics = {
  attachmentType: LocalAttachmentType;
  channelType: LocalChannelType;
  commandType: LocalCommandType;
  eventType: LocalEventType;
  messageType: LocalMessageType;
  reactionType: LocalReactionType;
  userType: LocalUserType;
};

// const chatClient = StreamChat.getInstance<StreamChatGenerics>(apiKey);

// if (process.env.REACT_APP_CHAT_SERVER_ENDPOINT) {
//   chatClient.setBaseURL(process.env.REACT_APP_CHAT_SERVER_ENDPOINT);
// }

// chatClient.connectUser({ id: userId }, userToken);

const makeCancellable = <T extends (...functionArguments: any) => any>(
  functionToCancel: T,
  delay = 100,
) => {
  let timeout: NodeJS.Timeout | null = null;

  const start = (...functionArguments: Parameters<T>) => {
    return new Promise((resolve, reject) => {
      if (timeout) return reject(new Error('"start" has been already called'));
      timeout = setTimeout(() => {
        timeout = null;
        try {
          resolve(functionToCancel(...functionArguments));
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };

  const cancel = () => {
    if (timeout === null) {
      return false;
    }
    clearTimeout(timeout);
    timeout = null;
    return true;
  };

  return [cancel, start] as const;
};

const useClient_closure = <SCG extends ExtendableGenerics = DefaultGenerics>({
  apiKey,
  userData,
  tokenOrProvider,
}: {
  apiKey: string;
  userData: OwnUserResponse<SCG> | UserResponse<SCG>;
  tokenOrProvider: TokenOrProvider;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat<SCG> | null>(null);

  useEffect(() => {
    const client = new StreamChat<SCG>(apiKey);

    let doSetClient = true;
    const connectionPromise = client.connectUser(userData, tokenOrProvider).then((d) => {
      if (doSetClient) setChatClient(client);
    });

    return () => {
      doSetClient = false;
      connectionPromise.then(() => {
        setChatClient(null);

        client.disconnectUser().then(() => {
          console.log('connection closed');
        });
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, userData.id, tokenOrProvider]);

  return chatClient;
};

const useClient_cancelable = <SCG extends ExtendableGenerics = DefaultGenerics>({
  apiKey,
  userData,
  tokenOrProvider,
}: {
  apiKey: string;
  userData: OwnUserResponse<SCG> | UserResponse<SCG>;
  tokenOrProvider: TokenOrProvider;
}) => {
  const [chatClient, setChatClient] = useState<StreamChat<SCG> | null>(null);

  useEffect(() => {
    const client = new StreamChat<SCG>(apiKey);

    const [cancel, start] = makeCancellable(client.connectUser);
    start(userData, tokenOrProvider).then((d) => {
      setChatClient(client);
    });

    return () => {
      const cancelled = cancel();

      if (cancelled) return;

      setChatClient(null);
      client.disconnectUser().then(() => {
        console.log('connection closed');
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, userData.id, tokenOrProvider]);

  return chatClient;
};

const users = [
  [
    'john',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiam9obiJ9.hmJ0875el-2ZVF38VX3qixdCNLnJ4bfTrrUft29Gjak',
  ],
  [
    'mark',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFyayJ9.f9ZLJwDXu7M69EagB7CH-UtHTZAapH-1ppEpKqwcjiE',
  ],
  [
    'jane',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiamFuZSJ9.2vNeXOojYBXr664emwXd39ESnrRawfsj_xVEWmA6B-w',
  ],
  [
    'peter',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicGV0ZXIifQ.ltrDbhWigzpVDPq3OB2fbk-rYxXGtDAyQnQoQluqdFg',
  ],
] as const;

// const filters: ChannelFilters = { type: 'messaging', members: { $in: [userId] } };
const options: ChannelOptions = { state: true, presence: true, limit: 10 };
const sort: ChannelSort = { last_message_at: -1, updated_at: -1 };

const App = () => {
  const [userIndex, setUserIndex] = useState(0);

  const [userId, userToken] = users[userIndex];

  const filters = useMemo(() => ({ type: 'messaging', members: { $in: [userId] } }), [userId]);

  const client = useClient_cancelable<StreamChatGenerics>({
    apiKey,
    userData: { id: userId },
    tokenOrProvider: userToken,
  });

  return (
    <>
      <button onClick={() => setUserIndex((ui) => (ui === users.length - 1 ? 0 : ++ui))}>
        cycle users
      </button>
      {client && (
        <Chat client={client}>
          <ChannelList filters={filters} sort={sort} options={options} showChannelSearch />
          <Channel>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      )}
    </>
  );
};

export default App;
