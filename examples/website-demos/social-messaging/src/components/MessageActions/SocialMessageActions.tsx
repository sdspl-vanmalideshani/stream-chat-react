import React, { useEffect, useState } from 'react';
import {
  ReactEventHandler,
  useChannelStateContext,
  useChatContext,
  useMessageContext,
} from 'stream-chat-react';

import {
  CopyMessage,
  DeleteMessage,
  EditMessage,
  FlagMessage,
  MuteUser,
  PinMessage,
  QuoteReply,
  StartThread,
} from '../../assets';
import { useViewContext, UserActions } from '../../contexts/ViewContext';

import type { UserResponse } from 'stream-chat';

type Props = {
  dropdownOpen: boolean;
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openThread?: ReactEventHandler;
  setMessageActionUser?: React.Dispatch<React.SetStateAction<string | undefined>>;
  thread?: boolean;
  user?: UserResponse | null;
};

export const SocialMessageActions: React.FC<Props> = (props) => {
  const { dropdownOpen, openThread, setDropdownOpen, setMessageActionUser, thread, user } = props;

  const { client, mutes } = useChatContext();
  const { pinnedMessages, messages, quotedMessage } = useChannelStateContext();
  const { setActionsModalOpenId, setUserActionType } = useViewContext();
  const { message } = useMessageContext();

  const [isUserMuted, setIsUserMuted] = useState(false);
  const [isMessagePinned, setIsMessagePinned] = useState(false);

  useEffect(() => {
    if (mutes.length) {
      const actionUserId = user?.id;

      const actionUserIsMuted = mutes.some((mute) => mute.target.id === actionUserId);
      setIsUserMuted(actionUserIsMuted);
    }
  }, [mutes.length]); // eslint-disable-line

  useEffect(() => {
    if (pinnedMessages && pinnedMessages.length) {
      const messageIsPinned = pinnedMessages.some((pin) => pin.id === message.id);
      setIsMessagePinned(messageIsPinned);
    }
  }, [pinnedMessages]); // eslint-disable-line

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (event.target instanceof HTMLElement) {
        const elements = document.getElementsByClassName('dropdown');
        const actionsModal = elements.item(0);

        if (!actionsModal?.contains(event.target)) {
          setDropdownOpen(false);
        }
      }
    };

    if (dropdownOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]); // eslint-disable-line

  const handleClick = (action: UserActions) => {
    if (user) setMessageActionUser?.(user.id);
    setActionsModalOpenId(message.id);
    setDropdownOpen(false);
    setUserActionType(action);
  };

  const isOwnUser = client.userID === user?.id;
  const isRecentMessage =
    messages?.[messages.length - 1].id === message.id ||
    messages?.[messages.length - 2]?.id === message.id ||
    messages?.[messages.length - 3]?.id === message.id;

  return (
    <div className={`dropdown ${isRecentMessage ? 'recent' : ''}`}>
      {thread && openThread && (
        <div className='dropdown-option' onClick={openThread}>
          <QuoteReply />
          <div className='dropdown-option-text'>Reply</div>
        </div>
      )}
      {thread && openThread && (
        <div className='dropdown-option' onClick={openThread}>
          <StartThread />
          <div className='dropdown-option-text'>Thread Reply</div>
        </div>
      )}
      <div className='dropdown-option' onClick={() => handleClick('copy')}>
        <CopyMessage />
        <div className='dropdown-option-text'>Copy Message</div>
      </div>
      <div
        className='dropdown-option'
        onClick={() => handleClick(isMessagePinned ? 'unpin' : 'pin')}
      >
        <PinMessage />
        <div className='dropdown-option-text'>
          {isMessagePinned ? 'Unpin from' : 'Pin to'} Conversation
        </div>
      </div>
      {!isOwnUser && (
        <>
          <div className='dropdown-option' onClick={() => handleClick('flag')}>
            <FlagMessage />
            <div className='dropdown-option-text'>Flag Message</div>
          </div>
          <div
            className='dropdown-option'
            onClick={() => handleClick(isUserMuted ? 'unmute' : 'mute')}
          >
            <MuteUser />
            <div className='dropdown-option-text'>{isUserMuted ? 'Unmute' : 'Mute'} User</div>
          </div>
        </>
      )}
      {isOwnUser && (
        <>
          <div className='dropdown-option' onClick={() => handleClick('edit')}>
            <EditMessage />
            <div className='dropdown-option-text'>Edit Message</div>
          </div>
          <div className='dropdown-option delete' onClick={() => handleClick('delete')}>
            <DeleteMessage />
            <div className='dropdown-option-text'>Delete Message</div>
          </div>
        </>
      )}
    </div>
  );
};
