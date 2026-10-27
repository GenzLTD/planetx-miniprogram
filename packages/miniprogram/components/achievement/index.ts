/**
 * Achievement Popup Component
 * Subscribes to event bus 'achievement' events.
 * Auto-dismisses after 2.5s (handled by store).
 */
import { eventBus } from '../../utils/event-bus'

Component({
  data: {
    visible: false,
    title: '',
    desc: '',
  },

  lifetimes: {
    attached() {
      this._handler = (a: any) => {
        if (a) {
          this.setData({ visible: true, title: a.title, desc: a.desc })
        } else {
          this.setData({ visible: false })
        }
      }
      eventBus.on('achievement', this._handler)
    },

    detached() {
      if (this._handler) {
        eventBus.off('achievement', this._handler)
      }
    },
  },

  methods: {
    // No user interaction needed - auto dismiss
  },
})
