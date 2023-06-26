## 5.0.2

- Fixed a bug that caused the faction of the active participant to not be hidden when conversation visibility was toggled off
- Fixed an issue that caused the _No participant text_ to be mispositioned

## 5.0.1

- Fixed a small bug which caused the image anchor setting to be applied only to the active participants and not to the other thumbnails.

## 5.0.0

Version 5.0.0 brings a lot of changes and reworks to the internal code of the module to make it more modular and easy to understand (the first update of several), while also bringing a brand new feature and several bug fixes and UI improvements.

- Added support for factions, allowing each participant to have an associated faction.
  - When creating or editing a conversation participant, a new tab has been added which allows GMs to configure the faction of that participant.
  - In this tab, you can customize all the aspects of the faction, such as the name or the logo/image, and should you wish so you can also use several predefined shapes and a color picker to also create a banner for the faction. For more complex banner shapes, a standalone image of the banner is recommended.
- Added the option of duplicating participants (this should help when creating multiple participants belonging to the same faction).
- Added numerous UI improvements and reworks for a more consistent and streamlined look across the module and FoundryVTT.
- Several bug fixes and QoL changes.

Disclaimer: Due to the large rework of the codebase, some bugs may have slipped through the cracks. If you encounter any such bug, please do not hesitate to contact me or to open an issue on GitHub, and I will try to fix it as soon as possible.

## 4.1.0

- Added the ability to reorder conversation participants by drag and dropping.
- Added a compatibility fix for custom UI modules that caused the conversation controls to be placed behind the sidebar. The fix can be enabled in the module settings.

## 4.0.0

- Added module settings. You can now change the way some features look as well as toggling some on/off. More customization options will be added in the future.
- Added support for FoundryVTT V11.
- Fixed small bugs and added missing localization for some text.

## 3.5.0

- Added the _Speak As_ functionality. When a conversation is active, the GM can now toggle if they want chat messages to be sent under the name of the currently active conversation participant.
- Added macros which can be used to programmatically trigger several of the ConversationHUD functionalities.
- Miscellaneous improvements and code refactoring.

## 3.4.0

- Improved the drag and drop functionality to allow journal entries as well.
  - Journal pages which have the _Image_ type will be treated as conversation participants on drag & drop.
  - Existing conversations can also be dragged into another conversation.
  - Most Monk's Enhanced Journal entries are also supported.
- Several bug fixes & improvements.

## 3.3.0

- Added option to drag and drop actors into conversations.
  - You can now drop actors into the conversation creation form.
  - You can also drop actors into a conversation that has been saved.
  - Finally, you can drop actors into an active conversation as well.

## 3.2.0

- Improved the edit functionality of participants to display the current data instead of empty fields.
- Fixed overflow issue that caused participants to not be selectable when multiple participants were present in a conversation.
- Added missing localization for several error messages.

## 3.1.0

- Fixed several scaling issues.

## 3.0.0

- Initial release.
