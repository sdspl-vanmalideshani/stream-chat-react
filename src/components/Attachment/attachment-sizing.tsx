import type { Attachment } from 'stream-chat';

export const getImageAttachmentConfiguration = (attachment: Attachment, element: HTMLElement) => {
  const url = new URL(
    (attachment.img_url || attachment.image_url || attachment.thumb_url || '') as string,
  );
  const { height, resizeDimensions } = getSizingRestrictions(url, element);

  if (resizeDimensions) {
    // Apply 2x for retina displays
    resizeDimensions.height *= 2;
    resizeDimensions.width *= 2;
    addResizingParamsToUrl(resizeDimensions, url);
  }

  return {
    height,
    url: url.href,
  };
};

export const getVideoAttachmentConfiguration = (
  attachment: Attachment,
  element: HTMLElement,
  shouldGenerateVideoThumbnail: boolean,
) => {
  let attachmentHeight = ``;
  let thumbUrl = undefined;
  if (attachment.thumb_url && shouldGenerateVideoThumbnail) {
    const url = new URL(attachment.thumb_url);
    const { height, resizeDimensions } = getSizingRestrictions(url, element);

    if (resizeDimensions) {
      // Apply 2x for retina displays
      resizeDimensions.height *= 2;
      resizeDimensions.width *= 2;
      addResizingParamsToUrl(resizeDimensions, url);
    }
    thumbUrl = url.href;
    attachmentHeight = height;
  } else {
    const cssSizeRestriction = getCSSSizeRestrictions(element);
    attachmentHeight = `${cssSizeRestriction.maxHeight || cssSizeRestriction.height || ''}px`;
  }
  return {
    height: attachmentHeight,
    thumbUrl,
    url: attachment.asset_url || '',
  };
};

const getSizingRestrictions = (url: URL, htmlElement: HTMLElement) => {
  const urlParams = url.searchParams;
  const originalHeight = Number(urlParams.get('oh')) || 1;
  const originalWidth = Number(urlParams.get('ow')) || 1;
  const cssSizeRestriction = getCSSSizeRestrictions(htmlElement);
  let resizeDimensions: { height: number; width: number } | undefined;
  let height = '';

  if ((cssSizeRestriction.maxHeight || cssSizeRestriction.height) && cssSizeRestriction.maxWidth) {
    resizeDimensions = getResizeDimensions(
      originalHeight,
      originalWidth,
      /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
      cssSizeRestriction.maxHeight || cssSizeRestriction.height!,
      cssSizeRestriction.maxWidth,
    );
    if (cssSizeRestriction.height) {
      height = `${cssSizeRestriction.height}px`;
    } else if (cssSizeRestriction.maxHeight) {
      // Calculate height because only max-height is provided
      const heightNum =
        originalHeight > 1 && originalWidth > 1
          ? originalHeight <= cssSizeRestriction.maxHeight &&
            originalWidth <= cssSizeRestriction.maxWidth
            ? originalHeight
            : Math.round(
                Math.min(
                  cssSizeRestriction.maxHeight,
                  (cssSizeRestriction.maxWidth / originalWidth) * originalHeight,
                ),
              )
          : cssSizeRestriction.maxHeight;
      height = `${heightNum}px`;
    }
  } else {
    resizeDimensions = undefined;
  }

  return { height, resizeDimensions };
};

const getResizeDimensions = (
  originalHeight: number,
  originalWidth: number,
  maxHeight: number,
  maxWidth: number,
) => ({
  height: Math.round(Math.max(maxHeight, (maxWidth / originalWidth) * originalHeight)),
  width: Math.round(Math.max(maxHeight, (maxWidth / originalHeight) * originalWidth)),
});

const getCSSSizeRestrictions = (htmlElement: HTMLElement) => {
  const computedStylesheet = getComputedStyle(htmlElement);
  const height = getValueRepresentationOfCSSProperty(computedStylesheet.getPropertyValue('height'));
  const maxHeight = getValueRepresentationOfCSSProperty(
    computedStylesheet.getPropertyValue('max-height'),
  );
  const maxWidth = getValueRepresentationOfCSSProperty(
    computedStylesheet.getPropertyValue('max-width'),
  );

  if (!((height || maxHeight) && maxWidth)) {
    console.warn(
      `Invalid value set for height/max-height and/or max-width for HTML element, this can cause scrolling issues inside the message list, more info https://getstream.io/chat/docs/sdk/react/message-components/attachment/#image-and-video-sizing`,
    );
  }

  return { height, maxHeight, maxWidth };
};

const getValueRepresentationOfCSSProperty = (property: string) => {
  if (!property.endsWith('px')) {
    return undefined;
  }
  const number = parseFloat(property);
  return isNaN(number) ? undefined : number;
};

const addResizingParamsToUrl = (resizeDimensions: { height: number; width: number }, url: URL) => {
  url.searchParams.set('h', resizeDimensions.height.toString());
  url.searchParams.set('w', resizeDimensions.width.toString());
};
