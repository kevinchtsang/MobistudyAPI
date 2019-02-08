'use strict'

/**
* This provides the data access for the audit log
*/
import utils from './utils'
import { applogger } from '../logger'

export default async function (db, logger) {
  let collection = await utils.getCollection(db, 'auditlogs')

  return {
    async addAuditLog (newLog) {
      let meta = await collection.save(newLog)
      newLog._key = meta._key
      return newLog
    },
    async getLogEventTypes () {
      let query = 'FOR log IN auditlogs RETURN DISTINCT log.event'
      applogger.trace('Querying "' + query + '"')
      let cursor = await db.query(query)
      return cursor.all()
    },
    async getAuditLogs (countOnly, after, before, eventType, studyKey, taskId, userEmail, sortDirection, offset, count) {
      let queryString = ''
      if (countOnly) {
        queryString = 'RETURN COUNT ( '
      }
      let bindings = { }
      queryString += `FOR log IN auditlogs
      FOR user IN users
      FILTER user._key == log.userKey `
      if (after && before) {
        queryString += `FILTER DATE_DIFF(log.timestamp, @after, 's') <=0 AND DATE_DIFF(log.timestamp, @before, 's') >=0 `
        bindings.after = after
        bindings.before = before
        console.log('after', after)
        console.log('before', before)
      }
      if (eventType) {
        queryString += `FILTER log.event == @eventType `
        bindings.eventType = eventType
      }
      if (studyKey) {
        queryString += `FILTER log.studyKey == @studyKey `
        bindings.studyKey = studyKey
      }
      if (taskId) {
        queryString += `FILTER log.taskId == @taskId `
        bindings.taskId = taskId
      }
      if (userEmail) {
        queryString += `FILTER user.email == @userEmail `
        bindings.userEmail = userEmail
      }
      if (!sortDirection) {
        sortDirection = 'DESC'
      }
      queryString += `SORT log.timestamp @sortDirection `
      bindings.sortDirection = sortDirection
      if (!countOnly && !!offset && !!count) {
        queryString += `LIMIT @offset, @count `
        bindings.offset = offset
        bindings.count = count
      }

      if (countOnly) {
        queryString += ' RETURN 1 )'
      } else {
        queryString += ` RETURN {
          _key: log._key,
          timestamp: log.timestamp,
          event: log.event,
          userEmail: user.email,
          message: log.message
        }`
      }
      applogger.trace(bindings, 'Querying "' + queryString + '"')
      let cursor = await db.query(queryString, bindings)
      if (countOnly) {
        let counts = await cursor.all()
        if (counts.length) return '' + counts[0]
        else return undefined
      } else return cursor.all()
    }
  }
}