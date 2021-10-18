import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageDropzone, FileUploadButton } from 'react-file-utils';

import {
  ChatAutoComplete,
  CooldownTimer,
  EmojiPicker,
  MessageInputProps,
  UploadsPreview,
  useMessageInputContext,
  useChannelStateContext,
  // QuotedMessagePreview,
} from 'stream-chat-react';

import { QuotedMessagePreview } from './SocialQuotedMessage';

import {
  Attach,
  CommandBolt,
  EmojiPickerIcon,
  GiphyIcon,
  GiphySearch,
  SendArrow,
} from '../../assets';

import { useGiphyContext } from '../../contexts/GiphyContext';

import './SocialMessageInput.scss';

type Props = MessageInputProps & {
  checked?: boolean;
  setChecked?: React.Dispatch<React.SetStateAction<boolean>>;
  threadInput?: boolean;
};

export const SocialMessageInput = (props: Props) => {
  const { checked, setChecked, threadInput = false } = props;

  const {
    closeCommandsList,
    cooldownInterval,
    cooldownRemaining,
    emojiPickerRef,
    handleChange,
    handleSubmit,
    numberOfUploads,
    openCommandsList,
    openEmojiPicker,
    setCooldownRemaining,
    text,
  } = useMessageInputContext();

  const {
    acceptedFiles,
    maxNumberOfFiles,
    multipleUploads,
    quotedMessage,
  } = useChannelStateContext();
console.log(quotedMessage); //////////////////

  const { giphyState, setGiphyState } = useGiphyContext();

  const messageInput = useMessageInputContext();

  const onCheckChange = () => setChecked?.(!checked);

  const [commandsOpen, setCommandsOpen] = useState(false);

  useEffect(() => {
    const handleClick = () => {
      closeCommandsList();
      setCommandsOpen(false);
    };

    if (commandsOpen) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [commandsOpen]); // eslint-disable-line

  const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      const { value } = event.target;

      const deletePressed =
        event.nativeEvent instanceof InputEvent &&
        event.nativeEvent.inputType === 'deleteContentBackward'
          ? true
          : false;

      if (text.length === 1 && deletePressed) {
        setGiphyState(false);
      }

      if (!giphyState && text.startsWith('/giphy') && !numberOfUploads) {
        event.target.value = value.replace('/giphy', '');
        setGiphyState(true);
      }

      handleChange(event);
    },
    [text, giphyState, numberOfUploads], // eslint-disable-line
  );

  const handleCommandsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    openCommandsList();
    setGiphyState(false);
    setCommandsOpen(true);
  };

  const SendButton = useMemo(
    () =>
      cooldownRemaining ? (
        <div className='input-ui-send-cooldown'>
          <CooldownTimer
            cooldownInterval={cooldownInterval}
            setCooldownRemaining={setCooldownRemaining}
          />
        </div>
      ) : (
        <SendArrow />
      ),
    [cooldownInterval, cooldownRemaining, setCooldownRemaining],
  );

  return (
    <>
      <div className='input-ui'>
        <div className='input-ui-icons'>
          <div className='input-ui-icons-attach'>
            <FileUploadButton
              disabled={Boolean(cooldownRemaining)}
              handleFiles={messageInput.uploadNewFiles}
            >
              <Attach cooldownRemaining={cooldownRemaining} />
            </FileUploadButton>
          </div>
          <div
            className='input-ui-icons-bolt'
            onClick={!numberOfUploads && !cooldownRemaining ? handleCommandsClick : () => null}
          >
            <CommandBolt cooldownRemaining={cooldownRemaining} />
          </div>
        </div>
        <ImageDropzone
          accept={acceptedFiles}
          handleFiles={messageInput.uploadNewFiles}
          multiple={multipleUploads}
          disabled={
            (maxNumberOfFiles !== undefined && messageInput.numberOfUploads >= maxNumberOfFiles) ||
            giphyState
          }
        >
          {quotedMessage && <QuotedMessagePreview quotedMessage={quotedMessage} />}
          <div className={`input-ui-input ${giphyState ? 'giphy' : ''}`}>
            {giphyState && !numberOfUploads && <GiphyIcon />}
            <UploadsPreview />
            <div className='input-ui-input-textarea'>
              <ChatAutoComplete onChange={onChange} placeholder='Send a message' />
              <EmojiPicker />
              {
                <>
                  {!giphyState && (
                    <div
                      className='input-ui-input-emoji-picker'
                      ref={emojiPickerRef}
                      onClick={!cooldownRemaining ? openEmojiPicker : () => null}
                    >
                      <EmojiPickerIcon />
                    </div>
                  )}
                </>
              }
            </div>
          </div>
        </ImageDropzone>
        <div
          className={`input-ui-send ${text || numberOfUploads ? 'text' : ''}`}
          onClick={handleSubmit}
        >
          {giphyState && !numberOfUploads ? <GiphySearch /> : SendButton}
        </div>
      </div>
      {threadInput && (
        <div className='thread-footer'>
          <input
            checked={checked}
            className='thread-footer-checkbox'
            onChange={onCheckChange}
            type='checkbox'
          />
          <div className='thread-footer-text'>Send also as direct message</div>
        </div>
      )}
    </>
  );
};
