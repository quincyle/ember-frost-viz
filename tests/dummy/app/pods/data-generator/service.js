import Ember from 'ember'
const {A, Service, computed, get} = Ember
import PropTypeMixin, {PropTypes} from 'ember-prop-types'
import {GaussianGenerator} from '../../utils/random-lib'

const Brownian = Ember.Object.extend({
  center: 0,
  velocity: 0,
  acceleration: 1,
  domain: [-100, 100],
  accelerator: computed(function () {
    const self = this
    const domain = this.get('domain')
    const variance = function () {
      return get(self, 'acceleration')
    }
    let value = GaussianGenerator.create({variance})
    if (value < domain[0] || value > domain[1]) {
      value = Math.min(domain[1], Math.max(domain[0], value))
      this.set('acceleration', -this.get('acceleration'))
    }
    return value
  }),
  step () {
    this.set('velocity', this.get('velocity') + this.get('accelerator').generate())
    return this.set('center', this.get('center') + this.get('velocity'))
  }
})

const PointGenerator = Ember.Object.extend(PropTypeMixin, {
  propTypes: {
    samplesPerInterval: PropTypes.number,
    intervalSpacing: PropTypes.number,
    currentTime: PropTypes.instanceOf(Date),
    data: PropTypes.array
  },
  getDefaultProps () {
    return {
      samplesPerInterval: 1,
      intervalSpacing: 86400,
      currentTime: new Date(1980, 1, 1),
      sample: Brownian.create({center: 0, acceleration: 3}),
      data: A([])
    }
  },
  addSample (currentTime) {
    return this.get('data').addObject({
      time: new Date(currentTime || this.get('currentTime')),
      value: this.get('sample').step()
    })
  },
  addInterval () {
    const currentTime = this.get('currentTime')
    for (let i = 0, n = this.get('samplesPerInterval'); i < n; ++i) {
      this.addSample(currentTime)
    }
    currentTime.setTime(currentTime.getTime() + this.get('intervalSpacing'))
    return this.get('data')
  },
  addIntervals (count) {
    for (let i = 0; i < count; ++i) {
      this.addInterval()
    }
    return this.get('data')
  }
})

export default Service.extend({
  createScatter (samplesPerInterval) {
    return PointGenerator.create({samplesPerInterval})
  }
})
