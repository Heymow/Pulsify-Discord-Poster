module.exports = {
  textbox: '[role="textbox"]',
  chatContent: '[class*="chatContent"]',
  messageContent: '[class*="messageContent"]',
  sendNowButton: '[role="button"] >> text=Send Now',
  guildName: 'nav[aria-label*=" server"] h1, nav[aria-label*=" Server"] h1, [data-testid="guild-header"] h1, [class*="headerContent"] h1',
  channelName: '[data-testid="channel-name"] h3, [class*="titleWrapper"] h3, section[aria-label*="channel"] h3',
  dmName: '[data-testid="conversation-header-name"] > span, [class*="titleWrapper"] h1, [class*="titleWrapper"] h3, [aria-label="Channel header"] h3',
  nsfwContinueButton: 'button:has-text("Continue"), button:has-text("Continuer"), button:has-text("I am 18+"), button:has-text("Je suis majeur")',
  fileInput: 'input[type="file"]',
};
