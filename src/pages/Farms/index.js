import React, { Suspense, lazy } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import config from '../../config'

// const Farms = lazy(() => import('./FarmsList'))
// const Staking = lazy(() => import('./Staking'))
// const BSCfarming = lazy(() => import('./BSCfarming'))

import Farms from './FarmsList'
import Staking from './Staking'
import BSCfarming from './BSCfarming'

export default function Farm() {
  console.log('params')
  const BSCfarmingParams = () => <BSCfarming />
  return (
    <>
      <Suspense fallback={null}>
        <Switch>
          <Route exact strict path="/farms" component={() => <Farms />} />
          <Route exact strict path={config.farmUrl + "staking"} component={() => <Staking />} />
          <Route exact strict path={config.farmUrl + "bscfarming"} component={BSCfarmingParams} />
          <Route
            path={config.farmUrl + "bscfarming/:lpToken"}
            render={({ match }) => {
              // console.log(match)
              return <BSCfarming initialTrade={match.params.lpToken} />
              // return (
              //   <Redirect to={{ pathname: config.farmUrl + "bscfarming", state: { lpToken: match.params.lpToken } }} />
              // )
            }}
          />
          {/* <Route strict path={config.farmUrl + "bscfarming"} component={BSCfarmingParams} />
          <Route
            exact
            strict
            path={config.farmUrl + "bscfarming/:lpToken"}
            render={({ match }) => {
              console.log(match)
              return <BSCfarming initialExchange={match.params.lpToken} />
            }}
          /> */}
          <Redirect to="/farms" />
        </Switch>
      </Suspense>
    </>
  )
}
