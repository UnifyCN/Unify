export const EVENT_CARD_WIDTH = 248;
export const EVENT_CARD_ASPECT_RATIO = 228 / 300;
export const EVENT_IMAGE_ASPECT_RATIO = 108 / 300;

export const getEventCardHeight = (width: number) =>
  Math.round(width * EVENT_CARD_ASPECT_RATIO);

export const getEventCardImageHeight = (width: number) =>
  Math.round(width * EVENT_IMAGE_ASPECT_RATIO);
