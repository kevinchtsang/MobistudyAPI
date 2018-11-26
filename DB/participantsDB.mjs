'use strict'

/**
* This provides the data access for the Study participants.
*/

import utils from './utils'
import { applogger } from '../logger'

export default async function (db, logger) {
  let collection = await utils.getCollection(db, 'participants')

  return {
    async getAllParticipants () {
      // TODO: use the filter for access control later
      var filter = ''

      // TODO: use LIMIT @offset, @count in the query for pagination

      var query = 'FOR participant in participants ' + filter + ' RETURN participant'
      applogger.trace('Querying "' + query + '"')
      let cursor = await db.query(query)
      return cursor.all()
    },

    async createParticipant (newparticipant) {
      // TODO: use the filter for access control later
      let meta = await collection.save(newparticipant)
      newparticipant._key = meta._key
      return newparticipant
    },

    async getOneParticipant (_key) {
      // TODO: use the filter for access control later
      const participant = await collection.document(_key)
      return participant
    },

    // udpates an participant, we assume the _key is the correct one
    async updateParticipant (_key, participant) {
      // TODO: use the filter for access control later
      let meta = await collection.replace(_key, participant)
      participant._key = meta._key
      return participant
    },

    // udpates an participant, we assume the _key is the correct one
    async patchParticipant (_key, participant) {
      // TODO: use the filter for access control later
      let newval = await collection.update(_key, participant, { keepNull: false, mergeObjects: true, returnNew: true })
      return newval
    },

    // deletes an participant
    async deleteParticipant (_key) {
      // TODO: use the filter for access control later
      await collection.remove(_key)
      return true
    }
  }
}