## 5.4.0

- Added the option to hide participant names.
- Added the option to customize the amount of blur that is applied to the conversation background. Setting the background blur to 0 pixels will permanently toggle it off.
- Added the option to temporarily toggle the background blur on/off.
- Reworked the way portraits are anchored. You can now specify both a horizontal and vertical anchor point which should allow for more flexibility when displaying portraits.
- Added the option to set portrait anchors for each participant individually. By default, the global options are used.
- Added the option to drag and drop participants from one conversation to another.
- Added the option to start scene conversations with their visibility off.
- Added support for video portraits.
- Added two extra API functions which can be used by macros (_actorToParticipant_ and _tokenToParticipant_).
- Added French translation (credit goes to MastaGooz).

## 5.3.1

- Fixed a bug that caused the drag and drop functionality to no longer work for tokens and actors.

## 5.3.0

- Added a new sheet used for CHUD factions. You can now save created factions into their respective sheets, which can then be assigned to conversation participants. This means you can now create a faction, save it, and then easily assign it to multiple participants using the _Faction Selector_ dropdown found in the _Faction Config_ tab.
- Added the option to pull scene actors into a conversation. By using the _Pull Participants from Scene_ button, you can select which actors are present in the current scene to pull into the conversation.
- Added the option to hide the conversation participants list for the players, who will only be able to see the currently active speaker. This feature can be toggled on or off in the module settings.
- Fixed the missing message type when using the _Speak As_ feature.
- Small UI improvements and fixes.

## 5.2.0

- Added the option to link a conversation to a scene. This option can be found in the _Scene Config_ screen on the _Ambience_ tab. Linked conversations will open automatically whenever the scene is activated.
- Fixed a bug that caused the _Activate Conversation_ button to be toggled off before the user confirmed their selection in the dialogue popup.

## 5.1.0

- Added the option to select a participant that will be enabled by default when a conversation is started.
- Added the option to link journal entries to participants (MEJ entries supported).
- Added an additional button to the conversation controls that closes the currently active conversation.
- Added confirmation dialogues when trying to close an active conversation or when trying to delete a participant in an active conversation.
- Fixed an issue which caused UI elements to overflow when using the top or bottom position for the camera dock.
- Fixed an issue which caused the conversation sheet display to close before the user could confirm if they wanted to keep or discard the unsaved changes (affected MEJ users only).
- Small UX and UI improvements.

## 5.0.2

- Fixed a bug that caused the faction of the active participant to not be hidden when conversation visibility was toggled off.
- Fixed an issue that caused the _No participant text_ to be mispositioned.

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
