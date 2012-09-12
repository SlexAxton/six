
var queryPat = /^([A-Za-z]*)?(?:\.([A-Za-z]+))?((?:\[[\w]+(?:(?:([*|^|$]?=)?(?!\]))(?:[0-9]+(?=\]))?(?:['"][\w]+['"](?=\]))?(?:true|false(?=\]))?)?\])*)$/
var attrPat = /^([\w]+)(?:(?:([*|^|$]?=)?(?!\]))(?:([0-9]+)(?=\]))?(?:['"]([\w]+)['"](?=\]))?(?:(true|false)(?=\]))?)?\]$/

// SEL, SEL
// SEL SEL
// SEL > SEL

function parse(selector) {
  return new parse.query(queryPat.exec(selector))
}

Object.define(parse, {

  query(dir) {
    if (dir === null) return null

    this.dir = dir
    this.ret = {}

    this.key()
    this.type()
    this.properties()

    return this.ret
  },

  key() { if ( this.dir[1] ) this.ret.key = this.dir[1] },
  type() { if ( this.dir[2] ) this.ret.type = this.dir[2] },

  properties() {
    if ( this.dir[3] ) {
      this.ret.properties = []

      this.dir[3].split("[").forEach(prop => {
        if ( prop ) this.property(prop)
      })
    }
  },

  property(prop) {
    var parts = attrPat.exec(prop)
    var obj = {}

    if ( parts && parts[1]) {
      obj.property = parts[1]
      if ( parts[2] ) {
        obj.operation = parts[2]
        if ( parts[3] ) obj.value = Number(parts[3])
        else if ( parts[4] ) obj.value = parts[4]
        else if ( parts[5] ) obj.value = Boolean(parts[5])
      }
      this.ret.properties.push(obj)
    }
  }

})

Object.define(parse.query.prototype, parse)

var Traversal = {

  select() {
    var results = []

    results.forEach.call(arguments, query => {
      var dir = parse(query)
      if ( dir ) this.children.forEach(child => {
        child.matches(dir) && results.push(child)
        child.select(query).forEach(child => results.push(child))
      })
    })

    return results
  },

  matches(dir) {
    var match = true
    if ( match && dir.key && this.key !== dir.key ) match = false
    if ( match && dir.type && this.ast.type !== dir.type ) match = false
    if ( dir.properties ) dir.properties.forEach(prop => {
      if ( match && prop.property && typeof this.ast[prop.property] === 'undefined' ) match = false
      if ( match && prop.property && prop.operation && typeof prop.value !== 'undefined') {
        if ( prop.operation === "=" && this.ast[prop.property] !== prop.value) match = false
        else if ( typeof this.ast[prop.property] === 'string' ) {
          switch (prop.operation) {
            case "^=":
              if ( !this.ast[prop.property].match("^" + prop.value) ) match = false; break
            case "$=":
              if ( !this.ast[prop.property].match(prop.value + "$") ) match = false; break
            case "*=":
              if ( !(~this.ast[prop.property].indexOf(prop.value)) ) match = false; break
          }
        }
      }
    })

    return match
  }

}

Object.define(Traversal, require("./rel").Relatives)

exports.Traversal = Traversal