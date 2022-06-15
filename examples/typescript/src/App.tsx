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
  delay = 200,
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
    if (timeout === null) return;
    clearTimeout(timeout);
    timeout = null;
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

    let didUserConnectInterrupt = false;
    const connectionPromise = client.connectUser(userData, tokenOrProvider).then((d) => {
      if (!didUserConnectInterrupt) setChatClient(client);
    });

    return () => {
      didUserConnectInterrupt = true;
      setChatClient(null);
      connectionPromise
        .then(() => client.disconnectUser())
        .then(() => {
          console.log('connection closed');
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

    let didUserConnectInterrupt = false;
    const [cancel, start] = makeCancellable(client.connectUser);
    const connectionPromise = start(userData, tokenOrProvider).then((d) => {
      // in case user missed cancelation timeout
      // but the connection is still in progress
      if (!didUserConnectInterrupt) setChatClient(client);
      console.log('setting client');
    });

    return () => {
      cancel();
      didUserConnectInterrupt = true;
      setChatClient(null);
      connectionPromise
        .then(() => client.disconnectUser())
        .then(() => {
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

// const c = StreamChat.getInstance(apiKey);

// const [[userId, userToken]] = users;

const App = () => {
  const [userIndex, setUserIndex] = useState(0);
  const [connected, setConnected] = useState(false);

  const [userId, userToken] = users[userIndex];

  const filters = useMemo(() => ({ type: 'messaging', members: { $in: [userId] } }), [userId]);

  const client = useClient_cancelable<StreamChatGenerics>({
    apiKey,
    userData: { id: userId },
    tokenOrProvider: userToken,
  });

  return (
    <>
      <button
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
        onClick={() => setUserIndex((ui) => (ui === users.length - 1 ? 0 : ++ui))}
      >
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
