<?php require_once('jbbed.php'); ?>
<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jbbed Editor</title>
<meta name="description" content="A simple BB editor">
<style>
    .change-theme {
        padding: 10px;
        margin-bottom: 20px;
    }
</style>
<link href="themes/icons/jbbicon/css/jbbicon.css" rel="stylesheet">
<link href="jbbed.css" rel="stylesheet">
<link href="themes/classic.css" rel="stylesheet">
<link href="themes/modern.css" rel="stylesheet">
<link href="themes/dark.css" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script src="jbbed.min.js"></script>
<?php echo jbbed_spoiler(); ?>
</head>
<body>
<div id="page" class="page">
<?php if( filter_has_var(INPUT_POST, 'jbbed') && strlen($_POST['jbbed']) > 0 ) : ?>
<div class="jbbed-classic">
    <div class="jbbed-preview">
        <?php echo jbbed_convert( $_POST['jbbed'] ); ?>
    </div>
</div>
<?php else: ?>
<div class="change-theme">
    <label for="change-theme">Change theme: </label>
    <select id="change-theme" data-val="">
        <option value="classic">Classic</option>
        <option value="modern">Modern</option>
        <option value="dark">Dark</option>
    </select>
</div>
<form method="POST" id="jbbed-form" action="">
<div class="container">
<textarea id="t" class="a texta" name="jbbed" cols="50" rows="10">
This is [b]strong word[/b]

This is [i]italic word[/i]

This is [u]underline word[/u]

This is [s]stroke word[/s]

This is [link=https://gist.github.com/iljester/fd24617b76b477779d908cb6de894387]Link[/link]

This is [link=https://www.google.com]Link[/link]

This is a orderer list:
[ol]
    [li]First item[/li]
    [li]Second item[/li]
    [li]Third item.[/li]
[/ol]

This is a unordere list:
[ul]
    [li]First item[/li]
    [li]Second item[/li]
    [li]Third item.[/li]
[/ul]

This is a spoiler message:

[spoiler]Uh, oh! You read this message![/spoiler]

Some colors:

[color=#0000ff]Color1[/color]
[color=#008000]Color2[/color]
[color=#ff0000]Color3[/color]
[color=#ffff00]Color4[/color]

[alignleft]Sentence aligned left[/alignleft]

[alignright]Sentence aligned right[/alignright]

[aligncenter]Sentence aligned center[/aligncenter]

Some titles:

[h1]H1 Title[/h1]
[h2]H2 Title[/h2]
[h3]H3 Title[/h3]

Some font sizes:

[size=30px]Very big font[/size]
[size=18px]Medium font[/size]
[size=10px]Small font[/size]

Some smilyes:

&#128512;&#128513;&#128514;&#128515;&#128516;&#128517;&#128531;&#128543;&#128555;&#128565;

Here a piece of code:

[code]/**
* Simple array shuffle 
* @params {array} array // array to shuffle
* @returns array // the shuffled array
*/
function arrayShuffle( array = [] ) {
    const n = [];

    for( let i = 0; i < array.length; i++) {
    let index = Math.floor(Math.random()*array.length);
    if( ! n.includes(a[index]) ) {
    n.push(a[index]);
    } else {
    continue;
    }
    }

    const diff = a.filter(v => ! n.includes(v));
    return n.concat(diff);

}[/code]

This is a quote:

[quote]A Genesis LP is: The Lamb Lies Down on Broadway[/quote]

Display an image:

[img=https://cdn.pixabay.com/photo/2024/04/28/07/00/bird-8724916_1280.jpg]

Separator (HR):

[hr]

Display a youtube video:

[vid=https://www.youtube.com/watch?v=WPOZO9sm5Jw]

Display a rumble video:

[vid=https://rumble.com/embed/v4q5rgn/?pub=4]

Display a Jsfiddle code:

[jsf=https://jsfiddle.net/zsydnp6g/]
</textarea>
<br>
<input type="submit" id="submit" value="Send" />
</div>
</form>
<script>
jQuery(function($) {

    $(document).on('change', '#change-theme', function() {
        $('.jbbed-container').removeClass('jbbed-classic jbbed-modern jbbed-dark');
        switch( $(this).val() ) {
            case 'classic' : $('.jbbed-container').addClass('jbbed-classic'); break;
            case 'modern' : $('.jbbed-container').addClass('jbbed-modern'); break;
            case 'dark' : $('.jbbed-container').addClass('jbbed-dark'); break;
        }
    });

    $('#t').jbbed();

    
});
</script>
<?php endif; ?>
</div>
</body>
</html>
