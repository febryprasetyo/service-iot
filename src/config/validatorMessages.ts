export default {
  'required': '{{ field }} must not be empty',
  'equals': '{{ field }} is invalid',
  'max': '{{ field }} length must be <= {{ args }}',
  'min': '{{ field }} length must be >= {{ args }}',
  'range': '{{ field }} value must be between {{ args }} and {{ args }}',
  'above': '{{ field }} value must be > {{ args }}',
  'unique': '{{ field }} value must be unique',
  'number': '{{ field }} value must be a number',
  'email': '{{ field }} not a valid email',
  'date': '{{ field }} not a valid date',
  'boolean': '{{ field }} not a valid boolean',
  'array': '{{ field }} not a valid array'
}