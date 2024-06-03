## Jbbed Editor

### Description
A simple BB editor in JQuery fully customizable.

### Require
This plugin requires JQuery.

### Additional informations
A beta version is currently being released not for production purposes but for testing.

### Basic Usage

```html
<!-- optional with autoload // see documentation -->
<link src="themes/icons/jbbicon/css/jbbicon.css" rel="stylesheet">
<!-- required -->
<link src="jbbed.css" rel="stylesheet">
<!-- optional with autoload // see documentation -->
<link src="themes/classic.css" rel="stylesheet">

<!-- required -->
<script src="jquery.min.js"></script>
<script src="jbbed.min.js"></script>
```


```js
$('#mytextarea').jbbed();
```
Or if you want multiple instances in a single page, the advice is to use jbbedMu:

```js
$('.mytextarea').jbbedMu();
```

### Basic output in php

```php
echo jbbed_convert( $string );
```
### Params

For documentations, please instructions [on my site](https://www.iljester.com/guide/jbbed-editor/).

### Demo link

You can find a working example at this address:
https://www.iljester.com/demo/jbbed/example.php

### Versions:

* 1.0b: development version