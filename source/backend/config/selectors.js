module.exports = {
  textbox: '[role="textbox"]',
  chatContent: '[class*="chatContent"]',
  messageContent: '[class*="messageContent"]',
  sendNowButton: '[role="button"] >> text=Send Now',
  guildName: '[data-testid="guild-header"] header h1, nav[aria-label*=" server"] h1, nav[aria-label*=" Server"] h1',
  channelName: '[data-testid="channel-name"] h3, section[aria-label*="channel"] h3, [class*="titleWrapper"] h3',
  dmName: '[data-testid="conversation-header-name"] > span, [class*="nameTag"] > span',
};
