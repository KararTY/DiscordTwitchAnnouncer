import AddCommand from './add.js'
import AnnouncementchatCommand from './announcementchannel.js'
import ChannelCommand from './channel.js'
import HelpCommand from './help.js'
import LanguageCommand from './language.js'
import MessageCommand from './message.js'
import OperatorCommand from './operator.js'
import ReactionCommand from './reaction.js'
import RemoveCommand from './remove.js'
import StreamersCommand from './streamers.js'
import TimezoneCommand from './timezone.js'
import UptimeCommand from './uptime.js'

export default function command (translate) {
  return [
    new HelpCommand(translate),
    new UptimeCommand(translate),
    new AddCommand(translate),
    new RemoveCommand(translate),
    new ChannelCommand(translate),
    new OperatorCommand(translate),
    new ReactionCommand(translate),
    new TimezoneCommand(translate),
    new MessageCommand(translate),
    new LanguageCommand(translate),
    new AnnouncementchatCommand(translate),
    new StreamersCommand(translate)
  ]
}
