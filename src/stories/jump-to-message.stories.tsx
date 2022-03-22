/* eslint-disable @typescript-eslint/no-explicit-any */
import '@stream-io/stream-chat-css/dist/css/index.css';
import React from 'react';
import {
  Channel,
  Chat,
  MessageList,
  useChannelActionContext,
  VirtualizedMessageList,
} from '../index';
import { chatClient, StyleFix, useQueryChannels } from './utils';

void MessageList;
void VirtualizedMessageList;

const channelId = import.meta.env.VITE_JUMP_TO_MESSAGE_CHANNEL;
if (!channelId || typeof channelId !== 'string') {
  throw new Error('expected JUMP_TO_MESSAGE_CHANNEL');
}

const JumpToMessage = () => {
  const { jumpToMessage } = useChannelActionContext();

  return (
    <button
      data-testid='jump-to-message'
      onClick={async () => {
        const results = await chatClient.search(
          {
            id: { $eq: channelId },
          },
          'Message',
          { limit: 1, offset: 120 },
        );

        jumpToMessage(results.results[0].message.id);
      }}
    >
      Jump to message 29
    </button>
  );
};

export const JumpInRegularMessageList = () => {
  const channel = useQueryChannels(channelId);
  if (!channel) {
    return null;
  }
  return (
    <div>
      <StyleFix />
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <JumpToMessage />
          <MessageList />
        </Channel>
      </Chat>
    </div>
  );
};

export const JumpInVirtualizedMessageList = () => {
  const channel = useQueryChannels(channelId);

  if (!channel) {
    return null;
  }

  return (
    <div>
      <StyleFix />
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <JumpToMessage />
          <VirtualizedMessageList />
        </Channel>
      </Chat>
    </div>
  );
};
