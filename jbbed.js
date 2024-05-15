/**
 * jbbed
 * @author Davide Mura (thejester72@gmail.com)
 * (c) 2024
 * @version 1.0beta
 * 
 * buttons available not by default: 
 *    xpost, alignleft, alignright, aligncenter, alignjustify
 * 
 */

(function ( $ ) {

  $.fn.jbbedMu = function (params = {}) {
    $(this).each(function() {
      params.editorID = Jbbed.randomString('jbbed', 5);
      $(this).jbbed(params);
    });
  }

  $.fn.jbbed = function (params = {}) {

    // add class to textarea
    $(this).addClass("jbbed-editor");

    // get id of textarea if exists and set editorID
    const editorID = $(this).attr('id');
    if( 
      typeof params.editorID !== 'undefined' &&
      params.editorID.trim().length === 0 && 
      typeof editorID !== 'undefined' && 
      editorID.trim().length > 0 ) 
    {
      params.editorID = editorID;
    }

    // ... else assign id to textarea if not have once
    if( typeof editorID === 'undefined' ) {
      $(this).attr('id', 'jbbed-' + params.editorID);
    }

    // init class
    const inst = new Jbbed( $(this), params ),
          frame = inst.frame,
          mainContainer    = frame.main,
          previewContainer = frame.preview,
          buttonsContainer = frame.buttons,
          emojiContainer   = frame.emoji;

    // add buttons container
    $(buttonsContainer).insertBefore(this);

    // add wrap container
    $(this).prev().wrap(mainContainer); // wrap buttons into mainContainer
    $(this).prev().append(this); // append editor textarea
    switch( inst.params.theme ) {
      case 'modern' :
        $(this).closest('#' + mainContainer.id).addClass('jbbed-modern jbbed-template');
        break;
      case 'classic' :
        $(this).closest('#' + mainContainer.id).addClass('jbbed-classic jbbed-template');
        break;
      case 'dark' :
        $(this).closest('#' + mainContainer.id).addClass('jbbed-modern jbbed-dark jbbed-template');
        break;
      case 'custom' :
        $(this).closest('#' + mainContainer.id).addClass('jbbed-custom jbbed-template');
    }

    // insert preview after textarea
    $(previewContainer).insertAfter(this);

    // get buttons frame
    inst.buttons($);

    // get fullscreen frame
    inst.fullscreen( $ );

    // get preview frame;
    inst.preview($);

    // do BBCode
    inst.textarea($);

  };

}(jQuery));

/**
 * Class to build BBCode
 */
class Jbbed {

  /**
   * Properties
   */
  ID = '';
  editor;
  params  = {};
  frame = {};
  allowed = [];  
  allButtons = [];
  buttonLocalized = {};
  tiny = false;

  /**
   * Default values
   */
  static defaults = {
    editorID: '',
    bars: {
      1: ['b', 'i', 'u', 's', '#', 'link', 'img', 'vid', '#', 'ol', 'ul', 'li', '#', 'quote', 'code'],
      2: ['size', 'font', 'color', 'head', '#', 'alignleft', 'aligncenter', 'alignright', '#', 'hr', 'spoiler', '#', 'emoji', 'jsf', '#', 'clear'],
    },
    modal: ['xpost', 'size', 'color', 'font', 'head', 'jsf'],
    modalArgs: {
      preview: true,
      previewSentence: 'The quick brown fox jumps over the lazy dog',
      previewBgColor: 'theme', // or hex color
      previewTextColor: 'theme', // or hex color
      palette: true
    },
    single: ['hr', 'img', 'emoji', 'vid', 'xpost', 'jsf'],
    select: {
      size:  ['--', 10,12,14,16,18,20,22,24,26,28,30],
      font:  ['--', 'Arial', 'Times New Roman', 'Lucida Sans', 'Roboto', 'Monospace', 'Courier', 'Helvetica', 'Georgia'],
      color: ['Black:#000000', 'Grey:#808080', 'Lightgrey:#d3d3d3', 'Blue:#0000ff', 
              'Lightblue:#add8e6', 'Green:#008000', 'Lightgreen:#90ee90', 'Purple:#800080', 
              'Violet:#ee82ee', 'Pink:#ffc0cb','Brown:#a52a2a','Saddlebrown:#8b4513',
              'Red:#ff0000','Orange:#ffa500','Yellow:#ffff00','White:#ffffff'],
      head:  ['--', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    },
    keepBars: true,
    selectiveRemove: ['script', 'iframe'],
    video: {
      youtube: [560, 315],
      rumble:  [640, 360],
    },
    embedCode: 'none', // or gist, or jsfiddle or codepen
    sizeUnit: "px",
    tagTranslate: {
      size: ['span', 'style="font-size:$1;"', "[a-zA-Z0-9]+"],
      font: ['span', 'style="font-family:$1;"', "[a-zA-Z0-9\\s]+"],
      color:['span', 'style="color:$1;"', "[a-fA-F0-9#]+"],
      link: ['a', 'href="$1"', "[^<>\\]\\[\\s]+"],
      img:  ['img', 'src="$1"', "[^<>\\s]+"],
      b:    ['strong', '', ''],
      quote: ['blockquote', '', ''],
      code: ['pre', '', ''],
      aligncenter: ['span', 'style="text-align:center;display:block;"', ''],
      alignleft: ['span', 'style="text-align:left;display:block;"', ''],
      alignright: ['span', 'style="text-align:right;display:block;"', ''],
      alignjustify: ['span', 'style="text-align:justify;display:block;"', ''],
      head: ['', '$1', '[1-6]+'],
      spoiler: ['div', 'style="display:none"', '']
    },
    textareaArgs: {
      font: "monospace",
      cols: 50,
      rows: 20,
      width: '100%',
      height: '500px',
      indent: true
    },
    previewArgs: {
      font: "sans-serif",
      width: "100%",
      height: "500px",
      autop: true,
    },
    spoilerArgs: {
      className: '',
      buttonHide: 'Hide',
      buttonShow: 'Spoiler',
      slide: 400
    },
    jsfPlay: {
      output: 'all', // html|css|js|result or all
      theme: 'dark' // dark or ''
    },
    emoji: true,
    fullscreen: true,
    showPreview: true,
    theme: 'classic',
    buttonsIcon: true,
    localizeButtons: {
      b:            ['label:B', 'title:Bold', 'className:jbbicon-b jbbicon'],
      i:            ['label:I', 'title:Italic', 'className:jbbicon-i jbbicon'],
      u:            ['label:U', 'title:Underline', 'className:jbbicon-u jbbicon'],
      s:            ['label:S', 'title:Strike', 'className:jbbicon-s2 jbbicon'],
      link:         ['label:Link', 'title:Link', 'className:jbbicon-link jbbicon'],
      img:          ['label:Img', 'title:Image', 'className:jbbicon-img jbbicon'],
      vid:          ['label:Video', 'title:Video', 'className:jbbicon-vid jbbicon'],
      ul:           ['label:UL', 'title:Unordered List', 'className:jbbicon-ul jbbicon'],
      ol:           ['label:OL', 'title:Ordered List', 'className:jbbicon-ol jbbicon'],
      li:           ['label:Li', 'title:List Item', 'className:jbbicon-li jbbicon'],
      code:         ['label:Code', 'title:Code', 'className:jbbicon-code jbbicon'],
      quote:        ['label:Cite', 'title:Cite', 'className:jbbicon-quote jbbicon'],
      clear:        ['label:Trash', 'title:Trash', 'className:jbbicon-trash jbbicon'],
      hr:           ['label:Line', 'title:Line', 'className:jbbicon-hr jbbicon'],
      aligncenter:  ['label:AlignCenter', 'title:Align Center', 'className:jbbicon-aligncenter jbbicon'],
      alignleft:    ['label:AlignLeft', 'title:Align Left', 'className:jbbicon-alignleft jbbicon'],
      alignright:   ['label:AlignRight', 'title:Align Right', 'className:jbbicon-alignright jbbicon'],
      alignjustify: ['label:AlignJustify', 'title:Align Justify', 'className:jbbicon-alignjustify jbbicon'],
      size:         ['label:Size', 'title:Size', 'className:jbbicon-size jbbicon'],
      font:         ['label:Font', 'title:Font', 'className:jbbicon-font1 jbbicon'],
      head:         ['label:Head', 'title:Head', 'className:jbbicon-head jbbicon'],
      color:        ['label:Color', 'title:Color', 'className:jbbicon-palette3 jbbicon'],
      edit:         ['label:Edit', 'title:Edit', 'className:jbbicon-edit jbbicon'],
      preview:      ['label:Preview', 'title:Preview', 'className:jbbicon-preview jbbicon'],
      ok:           ['label:OK', 'title:Ok', 'className:jbbicon-check jbbicon'],
      no:           ['label:NO', 'title:No', 'className:jbbicon-close jbbicon'],
      emoji:        ['label:Emoji', 'title:Emoji', 'className:jbbicon-emoticon jbbicon'],
      spoiler:      ['label:Spoiler', 'title:Spoiler', 'className:jbbicon-spoiler jbbicon'],
      jsf:         ['label:JsFiddle', 'title:JsFiddle', 'className:jbbicon-jsf jbbicon'],
      fullscreen:   ['label:Fullscreen', 'title:Fullscreen', 'className:jbbicon-fullscreen jbbicon']

    },
    localizeMessages: {
      link:   'Insert an url or email address:',
      vid:    'Insert a video ($1):',
      img:    'Insert an image url:',
      jsf:    'Insert link of your fiddle',
      xpost:  'Insert link of your X post',
      clear:  'Attention! You are about to delete your work! Are you sure?'
    }
  };

  static tinyBar = ['b', 'i', 'u', 'link', 'img', 'ul', 'ol', 'li', 'quote', 'hr', 'spoiler'];

  /**
   * The constructor
   * @param {object} editor
   * @param {object} params
   * @param {object} defaults
   */
  constructor(editor, params) {

    // initialize editor and params
    this.editor = editor;
    this.params = params;

    // parse values
    this.parseValues();

    this.ID = this.params.editorID;

    // frames
    this.frames();

    // set allowed tags
    this.allowedTags();
  }

  /**
   * Build editor structure
   */
  frames() {

    const ID = this.ID;

    // main container
    this.frame.main = Jbbed.createElement(
      'div',
      {
        cls: 'jbbed-container',
        id: 'container-' + ID
      }
    );

    // buttons container
    this.frame.buttons = Jbbed.createElement(
      'div',
      {
        cls: 'jbbed-buttons-container',
        id: 'buttons-container-' + ID
      }
    );

    // emoji container
    this.frame.emoji = Jbbed.createElement(
      'div',
      {
        cls: 'jbbed-emoji-container',
        id: 'emoji-container-' + ID
      }
    );

    // fullscreen frame
    this.frame.fullscreen = Jbbed.createElement(
      'div',
      {
        cls: 'jbbed-fullscreen-container',
        id: 'fullscreen-container-' + ID
      }
    ),

    // tab frame
    this.frame.tab = Jbbed.createElement(
      'ul',
      {
        cls: 'jbbed-tab-editor',
        id: 'tab-editor-' + ID
      }
    ),

    // preview container
    this.frame.preview = Jbbed.createElement(
      'div',
      {
        cls: 'jbbed-preview',
        id: 'preview-container-' + ID,
        css: 'display:none'
      }
    );
  
  }

  /**
   * Parse values
   */
  parseValues() {

    const 
    params    = this.params,
    defaults  = Jbbed.defaults;

    for (const d in defaults) {
      if (typeof params[d] === "undefined") {
        params[d] = defaults[d];
      }
    }

    // bars tiny?
    let tiny = false;
    if( params.bars === 'tiny') {
      params.bars = { 1: Jbbed.tinyBar };
      params.emoji = false;
      tiny = true;
      this.tiny = tiny;
    }

    // merge single tags
    params.single = Jbbed.explodeString(params.single, '|');
    params.single = defaults.single.concat(params.single);

    // merge modal
    params.modal = Jbbed.explodeString(params.modal, '|');
    params.modal = defaults.modal.concat(params.modal);

    // fallback for video attributes
    for( const d in defaults.video) {
      params.video[d] = Jbbed.explodeString( params.video[d], '|');
      if( params.video[d].length !== 2 || params.video[d] === false ) {
        params.video[d] = defaults.video[d];
      }
    }

    // fallback for localize buttons
    for( const d in defaults.localizeButtons) {
      params.localizeButtons[d] = Jbbed.explodeString( params.localizeButtons[d], '|');
      if( params.localizeButtons[d].length === 0 || params.localizeButtons[d] === false ) {
        params.localizeButtons[d] = defaults.localizeButtons[d];
      }
    }

    // keep default buttons if true
    if( tiny === false ) {
      if (params.keepBars === true) {
        params.bars = Jbbed.keepMerge(params.bars, defaults.bars);
      } 
      else if( typeof params.keepBars === 'string' || typeof params.keepBars === 'number' ) {
        params.bars = Jbbed.selectiveKeep(params.keepBars, params.bars);
      }
    }

    const buttons = params.bars;
    let allButtons = [];
    for( const [key, value] of Object.entries(buttons)) {
      allButtons = allButtons.concat(value);
    }
    this.allButtons = allButtons.filter((v) => v !== '#');

    // deep merge for select
    params.select = Jbbed.keepMerge(params.select, defaults.select);

    // deep merge tagTranslate
    params.tagTranslate = Jbbed.keepMerge( params.tagTranslate, defaults.tagTranslate);

    // add class to spoiler box if class is empty
    params.spoilerArgs.className = params.spoilerArgs.className.length === 0 ? 
          params.editorID + '-spoiler' :  params.spoilerArgs.className;
    params.tagTranslate.spoiler[1] = params.tagTranslate.spoiler[1] + ' class="' + params.spoilerArgs.className + '"';

    this.params = params;
  }

  /**
   * Build allowed tags
   */
  allowedTags() {

    const buttons    = this.allButtons,
          selectiveR = this.params.selectiveRemove;
    
    const allowed   = [],
          to_remove = Jbbed.explodeString( selectiveR, '|' );
    for( const b in buttons ) {
      if( to_remove.includes(buttons[b] ) ) {
        continue;
      } else {
        allowed.push(buttons[b]);
      }
    }
    
    this.allowed = allowed;
    
  }

  /**
   * Localize buttons and tabs
   * @param {string} thisButton 
   */
  localizeButtons( thisButton ) {

    const localize = this.params.localizeButtons;

    if( typeof localize[thisButton] === 'object' && localize[thisButton].length > 0 ) {
      thisButton = localize[thisButton];
    } else {
      thisButton = ['label:' + thisButton, 'title:' + thisButton, 'className:'];
    }

    let buttonAttrs = {};
    for( const s in thisButton ) {
      if( thisButton[s].indexOf(':') > -1 ) {
        const v = thisButton[s].split(':', 2);
        buttonAttrs[v[0]] = v[1];
      }
    }

    this.buttonLocalized = buttonAttrs;

  }


  /**
   * Build a modal dialog for some buttons
   * @param {object} thisButton
   * @returns 
   */
  dialogModal(thisButton) {
    const
    ID               = this.ID, 
    dataButton       = thisButton.attr('data-button'),
    buttonId         = '#' + thisButton.attr('id'),
    args             = {},
    select           = this.params.select,
    inselect         = Object.getOwnPropertyNames(this.params.select),
    modalArgs        = this.params.modalArgs,
    theme            = this.params.theme,
    localizeButtons  = this.params.localizeButtons,
    localizeMessages = this.params.localizeMessages,
    buttonsIcon      = this.params.buttonsIcon,
    sizeUnit         = this.params.sizeUnit,
    emoji            = this.params.emoji,
    video            = this.params.video,
    jbbedD           = ID + '-d';

    let type = 'url';

    // emoji button
    type = dataButton === 'emoji' && emoji !== false ? 'emoji' : type;

    // select buttons
    if( inselect.includes(dataButton) ) {
      type = dataButton === 'color' ? 'color' : 'select';
      const options = Jbbed.explodeString( select[dataButton], '|');
      for( const o in options ) {
        if( options[o].toString().indexOf(':') > -1 ) {
          const a = options[o].toString().split(':'),
                value = a[1], 
                label = a[0];
          if( type === 'color') {
            args['p' + value.substring(1)] = value;
          } else {
            args[value] = label; // value => text
          }
        } else {
          const px = (dataButton === 'size' && typeof options[o] === 'number' && options[o] > 0 ? 
            sizeUnit : '');
          const value = options[o] + px;
          args[value] = value;
        }
      }
    }
  
    if( 
      typeof dataButton === 'undefined' ||  // dataButton
      typeof buttonId === 'undefined' ||    // buttonId
      typeof type === 'undefined' ||        // type
      typeof args !== 'object' ) {          // args
      return false;
    }
    
    // remove previous dialog
    $('.jbbed-dialog').remove();

    const btn = document.getElementById(buttonId.substring(1)),
          left = btn.getBoundingClientRect().left;
    
    let cssPreview = [];
    if( modalArgs.previewBgColor !== 'theme')
      cssPreview.push('backgroundColor:' + modalArgs.previewBgColor);
    if( modalArgs.previewTextColor !== 'theme' ) 
      cssPreview.push('color:' + modalArgs.previewTextColor);

    // create dialog container
    let add = theme !== 'classic' ? 15 : 17;

    const 
    dialogContainer = Jbbed.createElement(
      'div', 
      { 
        id: dataButton + '-dialog-' + ID,
        cls: 'dialog-' + ID + ' jbbed-dialog ' + jbbedD,
        css: ['left:' + left + 'px' ],
      }
    ),

    // create dialog input container
    inputContainer = Jbbed.createElement(
      'div',
      { 
        id: dataButton + '-input-' + ID,
        cls: 'jbbed-dialog-input ' + jbbedD
      }
    ),

    // create buttons container
    buttonsContainer = Jbbed.createElement(
      'div',
      { 
        id: dataButton + '-buttons-' + ID,
        cls: 'jbbed-dialog-buttons ' + jbbedD
      }
    ),

    // create preview container
    previewContainer = Jbbed.createElement(
      'div',
      { 
        id: dataButton + '-preview-' + ID,
        cls: 'jbbed-dialog-preview ' + jbbedD,
        css: cssPreview
      }
    );

    // insert containers
    $(dialogContainer).insertAfter(buttonId);
    $('#' + dialogContainer.id).append([inputContainer, buttonsContainer]);
    if( modalArgs.preview === true ) {
      $('#' + dialogContainer.id).append(previewContainer);
      // add previewSentence
      if( type !== 'url') {
        $('#' + previewContainer.id).text(modalArgs.previewSentence);
      } else {
        $('#' + previewContainer.id).hide();
      }
    }

    const buttonAttrs = [],
          label = [],
          customClass = [],
          title = [];
    for( let i = 0; i < 2; i++ ) {
      let t = 'ok';
      switch(i) {
        case 0 : t = 'ok'; break;
        case 1 : t = 'no'; break;
      }
      this.localizeButtons(t);
      buttonAttrs[i] = this.buttonLocalized;
      label[i]      = buttonsIcon === true ? '' : buttonAttrs[i].label;
      customClass[i] = buttonAttrs[i].className.length > 0 ? ' ' + buttonAttrs[i].className : '';
      title[i]      = buttonAttrs[i].title.length > 0 ? buttonAttrs[i].title : '';
    }
   
    // insert buttons ok no
    const 
    buttonOk = Jbbed.createElement(
      'button', {
        id: dataButton + '-ok-' + ID,
        cls: 'jbbed-ok button-action-' + ID + ' ' + jbbedD + customClass[0],
        data: ['data-button:' + dataButton, 'data-value:'],
        type: 'button',
        title: title[0],
        textContent: label[0]
      }
    ),

    buttonNo = Jbbed.createElement(
      'button',
      {
        id: dataButton + '-no-' + ID,
        cls: 'jbbed-no ' + jbbedD + customClass[1],
        textContent: label[1],
        title: title[1],
        type: 'button'
      }
    )
    $('#' + buttonsContainer.id).append([buttonNo, buttonOk]);

    $(document).on('click', '#' + buttonOk.id, function() {
      $(dialogContainer).remove();
    });

    $(document).on('click', '#' + buttonNo.id, function() {
      $(dialogContainer).remove();
      return false;
    });

    let textContent = '';
    if( typeof localizeMessages[dataButton] !== 'undefined') {
      let supported = Object.keys(video).join(', ').trim(',');
      textContent = localizeMessages[dataButton].replace('$1', supported);
    }

    // insert value fields
    switch(type) {
  
      case 'url' :
        const 
        labelField = Jbbed.createElement(
          'label',
          {
            textContent : textContent,
            cls: 'dialog-label-' + ID + ' jbbed-dialog-label ' + jbbedD,
            htmlFor: dataButton + '-field-' + ID
          }
           
        ),
        field = Jbbed.createElement(
          'input',
          { 
            id: dataButton + '-field-' + ID,
            cls: 'jbbed-input-field ' + jbbedD,
            value: '',
            type: type
          }
        )
        $('#' + inputContainer.id).append([labelField,field]);

        $(document).on('keyup', '#' + field.id, function(e) {
          let value = $(this).val();
          $('#' + buttonOk.id).attr('data-value', value);
          if( modalArgs.preview === true ) {
            $('#' + previewContainer.id).html('');
            switch(dataButton) { 
              case 'img' :
                const img = Jbbed.createElement('img', { src: value }) ;
                $('#' + previewContainer.id).html(img).show();
                break;
              case 'vid' :
                value = Jbbed.buildVid(value, video);
                $('#' + previewContainer.id).html(value).show();
              break;
            }
            if( value.length === 0 ) {
              $('#' + previewContainer.id).html('')
            }
          }
        });
        break;
        
      case 'select' :
        const labelSelect = Jbbed.createElement(
          'label', 
          {
            textContent: localizeButtons[dataButton][0].split(':')[1],
            cls: 'dialog-label-sel-' + ID + ' jbbed-dialog-label-sel ' + jbbedD ,
            htmlFor: dataButton + '-select-' + ID
          }
        ),
        select = Jbbed.createElement(
          'select',
          { 
            id: dataButton + '-select-' + ID,
            cls: 'jbbed-select ' + jbbedD,
            value: args
          }
        )
        $('#' + inputContainer.id).append([labelSelect, select]);

        $(document).on('change', '#' + select.id, function() {
          let value = $(this).val();
          $('#' + buttonOk.id).attr('data-value', value);
          if( modalArgs.preview === true ) {
              switch(dataButton) { 
                case 'size' : $('#' + previewContainer.id).css('font-size', value); break;
                case 'font' : $('#' + previewContainer.id).css('font-family', value); break;
                case 'head' : 
                  let text = $('#' + previewContainer.id).text();
                  if( value.length === 0 || value === '--' ) {
                    $('#' + previewContainer.id).text(text);
                    return false;
                  }
                  
                  $('#' + previewContainer.id).text('');
                  let wrap = Jbbed.createElement(
                    value
                  );
                  wrap.append(text);
                  $('#' + previewContainer.id).append(wrap);
                  break;
              }
          }
        });

        break;
        
      case 'color' : 
        const 
        clsPalette = modalArgs.palette === true ? ' jbbed-full-palette' : ' jbbed-custom-palette',
        colors = Jbbed.createElement(
          'div',
          {
            id: dataButton + '-list-' + ID,
            cls: 'jbbed-' + dataButton + '-list' + clsPalette + ' ' + jbbedD
          }
        ),
        colorsInput = Jbbed.createElement(
          'input',
          {
            type: 'hidden',
            id: dataButton + '-selected-' + ID + ' ' + jbbedD
          }
        );
        $('#' + inputContainer.id).append([colors, colorsInput]);
        const 
        palette = modalArgs.palette === true ? Jbbed.colorPalette() : args,
        colorItemId = dataButton + '-item-' + ID
        for( const value in palette ) {
          const colorItem = Jbbed.createElement(
            'span',
            {
              id: dataButton + '-' + value + '-' + ID,
              cls: 'jbbed-color ' + colorItemId + ' ' + jbbedD,
              data: 'data-value:' + palette[value],
              css: 'backgroundColor:' + palette[value]
            }
          );
          $(colors).append(colorItem);
          let check = $('#' + thisButton.attr('id')).attr('data-checked');
          $('#' + check).addClass('checked');
        }

        $(document).on('click', '.' + colorItemId, function() {
          $('.' + colorItemId).removeClass('checked');
          $(this).addClass('checked');
          let value = $(this).attr('data-value');
          $('#' + thisButton.attr('id')).attr('data-checked', $(this).attr('id'));
          $(colorsInput.id).val(value);
          $('#' + buttonOk.id).attr('data-value', value);
          if( modalArgs.preview === true ) {
            $('#' + previewContainer.id).css('color', value);
          }
        });

        break;

      case 'emoji' :
        const 
        emojis = Jbbed.createElement(
          'div',
          {
            id: dataButton + '-list-' + ID,
            cls: 'jbbed-' + dataButton + '-list ' + jbbedD
          }
        ),
        emojiInput = Jbbed.createElement(
          'input',
          {
            type: 'hidden',
            id: dataButton + '-selected-' + ID + ' ' + jbbedD
          }
        ),
        del = Jbbed.createElement(
          'span',
          {
            id: 'del-' + ID,
            cls: 'jbbed-del ' + jbbedD
          }
        ),
        wrap = Jbbed.createElement(
          'div', {
            cls: 'jbbed-wrap-del-preview ' + jbbedD
          }
        );

        $(dialogContainer).append(wrap);
        $(wrap).append([previewContainer, del]);

        let 
        emoji = this.params.emoji,
        selected  = typeof emoji !== 'boolean' ? Jbbed.explodeString(emoji, '|') : emoji;
        emoji = Jbbed.getEmoji(selected);
        const emojiItemId = dataButton + '-item-' + ID;
        for( const e in emoji) {
          const emojiNum = emoji[e].slice(2,-1),
                elEm = Jbbed.createElement(
            'button',
            {
              id: dataButton + '-' + emojiNum + '-' + ID,
              cls: 'jbbed-button jbbed-emoji ' + emojiItemId + ' ' + jbbedD,
              type: 'button',
              data: 'data-value:' + emoji[e],
              htmlContent: emoji[e]
            }
          )
          $(emojis).append(elEm);
        }
        $('#' + inputContainer.id).append([emojis, emojiInput]);
        $(del).insertBefore(previewContainer);

        $(document).on('click', '.' + emojiItemId, function(e) {
          let value = $(this).attr('data-value');
          let prev = $(emojiInput).val();
          $('#' + buttonOk.id).attr('data-value', prev+value);
          $(emojiInput).val(prev+value);
          if( modalArgs.preview === true ) {
            $(previewContainer).html(prev + value);
          }
        });

        $(previewContainer).text('');
        $(document).on('click', '#' + del.id, function(e) {
          let prev = $(emojiInput).val();
          prev = prev.substring(0, prev.length-9);
          $('#' + buttonOk.id).attr('data-value', prev);
          $(emojiInput).val(prev);
          $(previewContainer).html(prev);
        })
      break;

      default: 
        return false;
          
    }
    
  }

  /**
   * Add buttons
   * 
   * @param object $ // jQuery object
   */
  buttons( $ ) {
    const 
    ID              = this.ID,
    instance        = this,
    bars            = this.params.bars,
    inselect        = Object.getOwnPropertyNames(this.params.select),
    select          = this.params.select,
    localizeButtons = this.params.localizeButtons,
    allowed         = this.allowed,
    theme           = this.params.theme,
    buttonsIcon     = this.params.buttonsIcon,
    emoji           = this.params.emoji,
    modal           = this.params.modal,
    btnsContainer   = this.frame.buttons,
    separator       = '#';

    // restore separator
    allowed.push(separator);
    
    let i = 0;
    for (let bar in bars) {
      if (bars[bar].length === 0) {
        continue;
      }

      const 
      buttons = Jbbed.explodeString(bars[bar], '|'),
      first = i === 0 ? ' jbbed-first-bar' : '',
      last = i === Object.entries(bars).length ? 'jbbed-last-bar' : '';
      i++;
      
      const elBar = Jbbed.createElement(
        'div', { cls:'bar-' + ID + ' jbbed-bar jbbed-bar-' + bar + first + last }
      );
      
      $('#' + btnsContainer.id).append(elBar);
      for (let b in buttons) {

        if( ! allowed.includes(buttons[b]) ) {
          continue;
        }

        if( emoji === false && buttons[b] === 'emoji') {
          continue;
        }

        if( buttons[b] === separator) {
          const elSep = Jbbed.createElement(
            'span', { cls: 'sep-' + ID + ' jbbed-sep' }
          );
          $(elBar).append(elSep);
          continue;
        }
       
        this.localizeButtons(buttons[b]);
        const buttonAttrs = this.buttonLocalized,
              label       = buttonsIcon === true ? '' : buttonAttrs.label,
              customClass = buttonAttrs.className.length > 0 ? ' ' + buttonAttrs.className : '',
              title       = buttonAttrs.title.length > 0 ? buttonAttrs.title : '';
        
        if (inselect.includes(buttons[b]) && ! modal.includes(buttons[b])) {
          // selections
          const 
          values = Jbbed.explodeString( select[buttons[b]], '|' ),   
          elLabel = Jbbed.createElement( 
            'label', { 
              cls : 'jbbed-label' + customClass,
               // In this case it is better that the drop down selector has a label
              textContent : buttonAttrs.label
            }
          ),
          elSelect = Jbbed.createElement(
            'select', {
              cls : 'button-select-' + ID + ' jbbed-button-select select-action-' + ID + ' ' + buttons[b] + '-button',
              data : 'data-button:' + buttons[b],
              value: values
            }
          );
          $(elBar).append(elLabel);
          $(elLabel).append(elSelect);
        } else {
          // These buttons must necessarily be displayed in a modal window. 
          // Therefore it is not necessary to insert them into the modal argument
          // Exceptionally for emoji, you can remove them from buttons. 
          // In that case, a sidebar will be displayed after the button bars.
          switch(buttons[b]) {
            case 'link'  : modal.push(buttons[b]); break;
            case 'img'   : modal.push(buttons[b]); break;
            case 'vid'   : modal.push(buttons[b]); break;
            case 'emoji' : modal.push(buttons[b]); break;
          }
          let actionClass = modal.includes(buttons[b]) ? 'modal-action-' + ID + ' ' : 'button-action-' + ID + ' '; // temp per ora.
          const elButton = Jbbed.createElement(
            'button',
            {
              title: title,
              id: buttons[b] + '-button-' + ID,
              cls: 'button-' + ID + ' jbbed-button ' + actionClass + buttons[b] + '-button' + customClass,
              textContent: label,
              type: 'button',
              data: 'data-button:' + buttons[b]
            }
          )
          $(elBar).append(elButton);
        }
      }
    } // end for

    $('.sep-' + ID).each(function() {
      if($(this).next().length === 0) {
        $(this).remove();
      }
    })

    $('.bar-' + ID).each(function() {
      if( $(this).is(':empty') ) {
        $(this).remove();
      }
    });

    $(document).on("click", '.modal-action-' + ID, function () {
      instance.dialogModal($(this));
    });
    $('html').on('click', function(e) {
      if( ! e.target.classList.contains(ID + '-d') ) {
        $('.dialog-' + ID).remove();
      }
    })

  }

  /**
   * Fullscreen frame
   * 
   * @param object $ // jQuery object
   */
  fullscreen( $ ) {
    const 
    ID               = this.ID,
    fullscreen       = this.frame.fullscreen,
    buttonsContainer = this.frame.buttons,
    mainContainer    = this.frame.main,
    buttonsIcon      = this.params.buttonsIcon,
    fsButton         = 'fullscreen',
    noShowPrev       = this.params.showPreview === false ? ' no-show-preview' : ''
    
    this.localizeButtons(fsButton);
    const
    buttonAttrs      = this.buttonLocalized,
    label            = buttonsIcon === true ? '' : buttonAttrs.label,
    customClass      = buttonAttrs.className.length > 0 ? ' ' + buttonAttrs.className : '',
    title            = buttonAttrs.title.length > 0 ? buttonAttrs.title : '';
    

    $(fullscreen).insertAfter(buttonsContainer);

    const fullscreenButton = Jbbed.createElement(
      'button',
      {
        id: 'fullscreen-button-' + ID,
        cls: 'jbbed-fullscreen-button' + customClass + noShowPrev,
        title: title,
        type: 'button',
        textContent: label
      }
    );

    $(fullscreen).append(fullscreenButton);
    $('#' + fullscreenButton.id).on('click', function() {
      const container = '#' + mainContainer.id;
      if( $(container).hasClass('jbbed-fullscreen') ) {
        $(container).removeClass('jbbed-fullscreen');
        $(this).removeClass('fullscreen-active');
      } else {
        $(container).addClass('jbbed-fullscreen');
        $(this).addClass('fullscreen-active');
      }
    });

  }

  /**
   * Create BBCode
   */
  doBBCode(thisButton) {
    const 
    myeditor        = this.editor,
    modal           = this.params.modal,
    inselect        = Object.getOwnPropertyNames(this.params.select),
    single          = this.params.single,
    sizeUnit        = this.params.sizeUnit,
    showPreview     = this.params.showPreview,
    tagTranslate    = this.params.tagTranslate,
    localizeMsg     = this.params.localizeMessages,
    allowed         = this.allowed;

    let emojiCode = thisButton.attr("data-emoji"),
        tag = thisButton.attr('data-button');

    if( tag === '' || ! allowed.includes(tag) ) {
      return false;
    }

    // remove all content if push clear button
    if( tag === 'clear' ) {
      if( myeditor.val().length === 0  ) {
        tag = '';
      } else {
        if (confirm(localizeMsg.clear) ) {
          myeditor.val('');
          return false;
        } else {
          return false;
        }
      }
    }

    const start = myeditor.attr("data-start"),
          end = myeditor.attr("data-end"),
          sel = myeditor.val().substring(start, end),
          modals = Jbbed.explodeString( modal, '|' );

    let attr = "";
    if (modals.includes(tag)) {
      attr = thisButton.attr('data-value'); // ok button
    }

    // if src is unset or empty, return false
    if (modals.includes(tag) && ( attr === null || typeof attr === 'undefined' )) {
      return false;
    } else if (modals.includes(tag) && attr.trim() === "") {
      return false;
    } else {
      // test if link is an email
      attr = Jbbed.testEmail(attr) === true && tag === 'link' ? 'mailto:' + attr : attr;
      attr = modals.includes(tag) && tag !== 'emoji' ? "=" + attr : attr;
      emojiCode = modals.includes(tag) && tag === 'emoji' ? attr: emojiCode;
    }

    // create tag bb for select buttons
    // We don't use tagAttrs because it is also used to convert alias tags to html tags
    let hasAttr = Object.getOwnPropertyNames(tagTranslate);

    if (inselect.includes(tag) && ! modals.includes(tag)) {
      let value = thisButton.val().trim();
      if ( hasAttr.includes(tag) ) {
        attr = value.length > 0 ? "=" + value + (tag === "size" ? sizeUnit : "") : false;
        if( attr === false ) {
          return false;
        }
      } 
    }

    // create tag BB
    let wrap = "[" + tag + attr + "]" + sel + "[/" + tag + "]",
        taglen = "[" + tag + attr + "][/" + tag + "]",
        singles = Jbbed.explodeString( single, '|');
    
    // check if is a single tag
    if (singles.includes(tag)) {
      if (tag !== "emoji") {
        wrap = sel + "[" + tag + attr + "]";
        taglen = "[" + tag + attr + "]";
      } else {
        wrap = sel + emojiCode;
        taglen = wrap;
      }
    }

    // split textarea string
    const before = myeditor.val().substring(0, start),
          after = myeditor.val().substring(end),
          string = before + wrap + after;

    // put string with bbtags in the textarea
    myeditor.val(string);

    //... then, position caret at the end of the last filled BB tag
    myeditor[0].selectionEnd = +end + taglen.length;
    myeditor[0].focus({ preventScroll: true });

  }

  /**
   * Prepare textarea
   * 
   * @param object $ // jQuery object
   */
  textarea( $ ) {
    const 
    instance        = this,
    ID              = this.ID,
    editor          = this.editor,
    indent          = this.params.textareaArgs.indent,
    textareaArgs    = this.params.textareaArgs;

    // add params to textarea editor
    Jbbed.addProp(editor, textareaArgs);

    // indent textarea
    Jbbed.textareaIndent( editor.attr('id'), indent );

    // set data start and end
    editor.attr("data-start", 0);
    editor.attr("data-end", 0);

    // select string and stored positions
    editor.on("select click keyup keydown tap", function () {
      const start = $(this)[0].selectionStart,
            end = $(this)[0].selectionEnd;
      $(this).attr("data-start", start);
      $(this).attr("data-end", end);
    });

    // put BBcode in textarea
    $(document).on("click", '.button-action-' + ID, function () {
      instance.doBBCode($(this));
    });

    $(document).on("change", '.select-action-' + ID, function () {
      instance.doBBCode($(this));
    });
  }

  /**
   * Add spoiler script to spoiler bbTag
   */
  spoiler() {

    const 
    ID           = this.ID,
    target       = this.params.spoilerArgs.className,
    buttonHide   = this.params.spoilerArgs.buttonHide,
    buttonShow   = this.params.spoilerArgs.buttonShow,
    slide        = this.params.spoilerArgs.slide,
    spoilerContainer = Jbbed.createElement(
      'div',
      {
        cls: 'jbbed-spoiler-container'
      }
    ),
    button = Jbbed.createElement(
      'button',
      {
        textContent: buttonShow,
        cls: 'button-spoiler-' + ID + ' jbbed-button-spoiler'
      }
    );

    $('.' + target).wrap(spoilerContainer);
    $(button).insertAfter('.' + target);

    const id = '.button-spoiler-' + ID;

    $(id).on("click", function() {
      const btn = $(this);
      btn.prev().toggle(slide, function() {
        if( ! $(this).is(':hidden')) { // show
          btn.text(buttonHide);
        } else { // hide
          btn.text(buttonShow)
        }
      });
    });

  }

  /**
   * Append jsfiddle snippet
   */
  jsf() {  

    const 
    args      = this.params.jsfPlay,
    previewId = this.frame.preview.id,
    preview   = $('#' + previewId);

    let attrs = '';
    if( args.output !== 'all') {
      attrs = Jbbed.explodeString(args.output, '|');
      attrs = attrs.join(',') + '/';
    }

    let theme = ''
    if( args.theme.length > 0 ) {
      theme = args.theme;
    }

    const jsfContainer = preview[0].getElementsByClassName('jsfiddle-snippet');
    for( const j of jsfContainer ) {
        const src = j.getAttribute('data-src');
        const jsf = Jbbed.createElement(
          'script',
          {
            src: src + 'embed/' + attrs + theme,
            async: true
          }
        )
        j.append(jsf);
    }

  }

  /**
   * Do Html for preview
   */
  doHtml() {
    const
    editor        = this.editor,
    preview       = this.frame.preview,
    autop         = this.params.previewArgs.autop,
    allowed       = this.allowed.join('|'),
    tagTranslate  = this.params.tagTranslate,
    videoParams   = this.params.video,
    string        = $(editor).val()

    // convert special chars and newline
    let newstring = string         
      .replace(/</g, "&lt;") // convert < special char
      .replace(/>/g, "&gt;") // convert > special char            
      .replace(/\n|\r|\r\n/gm, '<br>');  // convert newline in br    
      
    // remove br from lists
    const matched = newstring.match(/\[(ul|ol)\](.*?)\[\/(ul|ol)\]/gs);
    for(const m in matched ) {
      let mat = matched[m].match(/\[(ul|ol)\](.*?)\[\/(ul|ol)\]/s);
      const regex = new RegExp('(>|\\])(\\s+)', 'gms');
      const prev = mat[2];
      const replaced = prev.replace(regex, '$1').replace(/\s*<br>{1,}\s*/g, '');
      newstring = newstring.replace(prev, replaced);
    }

    // now, check if tag is allowed
    if (allowed.toString().trim().length > 0) {
      const regex = new RegExp("\\[\\/?(" + allowed + ")\\s*(.*?)\\]", "gm"),
            matches = newstring.match(regex);
      for (const m in matches) {
        const to = matches[m].slice(1, -1);
        newstring = newstring.replace("[" + to + "]", "###" + to + "###");
      }
      // remove unallowed bbtags && restore bbtag for allowed tags
      newstring = newstring
        .replace(/\[(\/?[a-z0-9]+)(=(.*?))?\]/g, "")
        .replace(/\/?###(.*?)###/g, "[$1]");
    }

    // translate bbcode with attributes or bbcode alias
    for( let [bbTag, value] of Object.entries( tagTranslate ) ) {
      value = Jbbed.explodeString(value, '|', 3);
      const htmlTag   = value[0].trim();
      const attrs     = value[1].trim();
      let filter      = ".*?";
      if ( typeof value[2].trim().length > 0 ) {
        filter = value[2].trim();
      }

      // simple translate (no attrs, but the html tag is different from the bbcode tag)
      if( attrs.length === 0 ) {
        newstring = newstring
          .replaceAll("[" + bbTag + "]", "<" + htmlTag + ">")
          .replaceAll("[/" + bbTag + "]", "</" + htmlTag + ">");
        continue;
      }

      // static translate (attrs does not require value substitution)
      if(  attrs.length > 0 && attrs.indexOf('$1') === -1 ) {
        newstring = newstring
          .replaceAll("[" + bbTag + "]", "<" + htmlTag + ' ' + attrs + ">")
          .replaceAll("[/" + bbTag + "]", "</" + htmlTag + ">");
        continue;
      }

      // dynamic translate (attrs require value substitution)
      const regex = new RegExp("\\[(" + bbTag + ")=(" + filter + ")\\]", "gmi"),
            matches = newstring.matchAll(regex);
      for (const m of matches) {
        
        const to = m[0].slice(1, -1),
              value = m[2];

        let tag   = htmlTag;
        let attr  = attrs.replace("$1", value);
        let space = ' ';
        // case in which the htmltag is also an attribute of the BBCode
        if( ( tag === '' || tag === '*' ) && attrs === '$1'  ) {
          tag = attr;
          attr = '';
          space = '';
        }
        let open = tag + space + attr;
        let close = tag;

        newstring = newstring
          .replace("[" + to + "]", "<" + open + ">")
          .replace("[/" + bbTag + "]", "</" + close + ">");
      }
    }

    // If the html pre tag is used, the content will be wrapped in <code> first.
    // The substitution is made here, because it could also be that the user of 
    // the script decides to assign attributes to the pre tag
    if( tagTranslate.code[0] === 'pre' ) {
      newstring = newstring.replace(/(<pre>)(.*?)(<\/pre>)/g, '$1<code>$2</code>$3');
    }

    // fill video in newstring
    const matches = newstring.matchAll(/\[vid=([^<>\]\[\s]+)\]/g);
    for (const v of matches) {
      const iframe = Jbbed.buildVid(v[1], videoParams);
      newstring = newstring.replace(v[0], iframe);
    }

    // create jsf container and fill in newstring
    const jsf = newstring.matchAll(/\[jsf=([^<>\]\[\s]+)\]/g);
    for (const v of jsf) {
      const r = Math.random(),
            id = Jbbed.randomString(r, 5),
            pattern_jsf  = /(\/\/)?(www\.)?jsfiddle\.net/g,
            test_jsf     = pattern_jsf.test(v[1]);
      if( test_jsf === true ) {
        newstring = newstring.replace(v[0],  Jbbed.createElement(
          'span',
          {
            id: 'jsf-' + id,
            cls: 'jsfiddle-snippet',
            data: 'data-src:' + v[1].replace(/http(s):?/g, '')
          },
          true
        ));
      }
    }

    // convert tags without attrs
    newstring = newstring.replace(/\[(\/?[a-z0-9]+)(=(.*?))?\]/g, "<$1$2>");

    // add autop
    if( autop === true ) {

      // remove previous p
      let newstring = string.replace(/<\/?p>/gm, '');

      // list of html block elements
      const arr = [
        'ol','ul','pre','blockquote','hr','h1','h2','h3','h4','h5','h6',
        'address','article','aside','canvas','dd','div','dl','dt','fieldset',
        'figcaption','figure','footer','form','header','li','main',
        'nav','noscript','section','table','video','tfoot','nav',
        'table','details','dialog','hgroup','tbody','td','th','thead',
        'noframes','menu'
      ];

      const regex  = new RegExp('<br>{1,}|<\\\/p><p>{1,}(<(' + arr.join('|') + ')>)', 'gms');
      const regex2 = new RegExp('(<\\\/(' + arr.join('|') + ')>)<\\\/p>', 'gms');

      newstring = newstring
      .replace(/<br><br>/gms, '</p><p>')
      .replace(regex, '</p>$1')
      .replace(regex2, '$1') // remove closed p after block elements
      .replace(/(<(hr)>)<\/p>/gms, '$1') // only single tags
      .replace(/<\/p>[^<]/gms, '<br>')
      .replace(/<\/p>$/gms, ''); // remove last closed p tag

      newstring = '<p>' + newstring + '</p>';

    }

    // add html content to preview
    $('#' + preview.id).html(newstring);

    // initialize spoiler
    this.spoiler();

    // initialize jsfiddle snippet
    this.jsf();

  }

  /**
   * Add tabs to switch editor -> preview
   * 
   * @param object $ // jQuery object
   */
  preview( $ ) {
    const 
    ID              = this.ID,
    instance        = this,
    localizeButtons = this.params.localizeButtons,
    editor          = this.editor,
    previewContainer= this.frame.preview,
    buttonsIcon     = this.params.buttonsIcon,
    previewArgs     = this.params.previewArgs,
    showPreview     = this.params.showPreview,
    buttonAttrs     = [],
    label           = [],
    customClass     = [],
    title           = [],
    tab             = this.frame.tab,
    tabItem         = [],
    tabbedID        = 'tabbed-' + ID,
    tabButtons      = ['edit', 'preview'];

    // hide preview if showPreview is set to false
    if ( showPreview === false ) {
      return false;
    }

    // build tabs and preview
    for( const b in tabButtons ) {
      let a = '';
      switch(tabButtons[b]) {
        case 'edit'       : a = ' active jbbed-tab-edit ' + tabbedID; break;
        case 'preview'    : a = ' jbbed-tab-preview ' + tabbedID; break;
      }
      
      this.localizeButtons(tabButtons[b]);
      buttonAttrs[b] = this.buttonLocalized;
      label[b]       = ( buttonsIcon === true ? '' : buttonAttrs[b].label);
      customClass[b] = buttonAttrs[b].className.length > 0 ? ' ' + buttonAttrs[b].className : '';
      title[b]       = buttonAttrs[b].title.length > 0 ? buttonAttrs[b].title : '';

      tabItem[b] = Jbbed.createElement(
        'li',
        {
          title: title[b],
          id: tabButtons[b] + '-' + ID,
          cls: 'tab' + ' ' + tabButtons[b] + a + customClass[b]
        }
      )
    }

    $(tab).append(tabItem)
    $(tab).insertBefore(editor);
    const tabBtn = $('.' + tabbedID),
          preview = $('#' + previewContainer.id),
          wrapperTab = Jbbed.createElement(
      'div', {
        cls: 'jbbed-wrapper-tab',
        id: 'wrapper-tab-' + ID
      }
    );

    editor.wrap(wrapperTab);
    editor.parent().append(preview);
      
    // add params for preview
    Jbbed.addProp(preview, previewArgs);

    // on click generate preview when user show preview
    preview.html('');
    $(tabBtn).on("click", function () {
      const tabButton = editor.parent().prev().children("li");
      tabButton.removeClass("active");
      $(this).addClass("active");
      if ($(this).hasClass("edit")) {
        $('.button-' + ID).removeClass('jbbed-disabled').prop('disabled', false);
        editor.show();
        preview.hide();
        preview.html('');
      } else {
        editor.hide();
        $('.button-' + ID).addClass('jbbed-disabled').prop('disabled', true);
        
        // generate preview
        instance.doHtml();
        
        // show preview
        preview.show();
      }
    });
  }
    /**
   * Get video. Supported Youtube and Rumble
   * @param {string} url
   * @param {object} params
   */
    static buildVid(url, params = {}) {
      if (
        url.trim().length === 0 ||
        typeof url === "undefined" ||
        url === "null"
      ) {
        return;
      }
  
      let iframe = "";
      const parse_url   = new URL(url),
            pattern_yt  = /(www\.)?youtu(\.)?be(\.com)?/g,
            test_yt     = pattern_yt.test(url),
            pattern_rum = /(www\.)?rumble\.com/g,
            test_rum    = pattern_rum.test(url);
  
      // yt
      if (test_yt === true) {
        
        let code = parse_url.searchParams.get("v");
        if (code == null) {
          code = parse_url.pathname.slice(1);
        }
        if (code === "null" || typeof code === "undefined") {
          return;
        }
        if (code.search("embed") > -1) {
          code = code.substring(6);
        }
  
        const attrs = Jbbed.explodeString( params.youtube, '|' ),
              width = attrs[0],
              height = attrs[1],
              src = "https://www.youtube-nocookie.com/embed/" + code + "?controls=1";
  
        iframe =
          '<iframe width="' +
          width +
          '" height="' +
          height +
          '" src="' +
          src +
          '" title="Youtube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
      
      } else if (test_rum === true) {
        
        let code = parse_url.pathname.slice(7, -1);
  
        if (code === "null" || typeof code === "undefined") {
          return;
        }
  
        const attrs =  Jbbed.explodeString( params.rumble, '|' ),
              width = attrs[0],
              height = attrs[1],
              src = "https://rumble.com/embed/" + code + "/?pub=4";
  
        iframe =
          '<iframe class="rumble" width="' + width + '" height="' + height + '" src="' + src + '" frameborder="0" allowfullscreen></iframe>';
      }
  
    return iframe;
  }

  /**
   * Create element
   * @param {string} tag 
   * @param {object} attrs 
   * @param {bool} html
   * @param {bool} inner
   * @returns object
   */
  static createElement( tag, attrs = {}, html = false, inner = false) {

    const el = document.createElement(tag);
    if( typeof attrs.id !== 'undefined') el.id = attrs.id;
    if( typeof attrs.cls !== 'undefined') el.className = attrs.cls;
    if( typeof attrs.type !== 'undefined') el.type = attrs.type;
    if( typeof attrs.name !== 'undefined') el.name = attrs.name;
    if( typeof attrs.src !== 'undefined') el.src = attrs.src;
    if( typeof attrs.href !== 'undefined') el.href = attrs.href;
    if( typeof attrs.title !== 'undefined') el.title = attrs.title;
    if( typeof attrs.for !== 'undefined') el.for = attrs.for;
    if( typeof attrs.textContent !== 'undefined') el.textContent = attrs.textContent;
    if( typeof attrs.htmlContent !== 'undefined') el.innerHTML = attrs.htmlContent;
    if( typeof attrs.target !== 'undefined') el.target = attrs.target;
    if( typeof attrs.htmlFor !== 'undefined') el.htmlFor = attrs.htmlFor;
    if( attrs.async === true ) el.setAttribute('async', '');

    if( tag === 'select' && typeof attrs.value === 'object') {
      for( const v in attrs.value ) {
        const option = document.createElement('option');
        option.value = attrs.value[v] === '--' ? '' : attrs.value[v];
        option.textContent = attrs.value[v];
        if ( attrs.value[v].toString().indexOf(':') > -1) {
          attrs.value[v] = attrs.value[v].split(":");
          option.textContent = attrs.value[v][0];
          option.value = attrs.value[v][1];
        }
        el.appendChild(option)
      }
    } else {
      if( typeof attrs.value !== 'undefined') el.value = attrs.value;
    }

    const css = attrs.css
    if( typeof attrs.css === 'object') {
      for( const c in css) {
        if( css[c].indexOf(':') < 1 ) {
          continue;
        }
      	const arg = css[c].split(':');
      	el.style[arg[0]] = arg[1];
      }
    } else {
        if( typeof css === 'string' && css.indexOf(':') > 0 ) {
          const arg = css.split(':');
    		  el.style[arg[0]] = arg[1];
        }	
    }

    const data = attrs.data;
    if( typeof data === 'object') {
      for( const d in data) {
        if( data[d].indexOf(':') < 1 ) {
          continue;
        }
      	const arg = Jbbed.cutString( data[d], ':', 1 )
      	el.setAttribute( arg[0], arg[1] );
      }
    } else {
        if( typeof data === 'string' && data.indexOf(':') > 0 ) {
          const arg = Jbbed.cutString( data, ':', 1 );
    		  el.setAttribute( arg[0], arg[1] );
        }	
    }

    return html === true ? ( inner === true ? el.innerHTML : el.outerHTML ) : el;

  }

  /**
   * Keep merge values
   * @param {object} value_1 // custom values or first values
   * @param {object} value_2 // default values or second values
   * @returns object array
   */
  static keepMerge(value_1, value_2, assign = true) {

    if (assign === true) {
      value_1 = Object.assign({}, value_2, value_1);
    }
   
    for (const v in value_1) {
      value_1[v] = Jbbed.explodeString(value_1[v], '|');
      if (typeof value_2[v] !== "undefined" && value_2[v] !== value_1[v]) {
        value_1[v] = value_2[v].concat( value_1[v] );
      }
    }
    return value_1;
  }

  /**
   * 
   * @param {mixed} keep 
   * @param {object|string} value 
   * @returns 
   */
  static selectiveKeep( keep, value ) {

    if( typeof keep === 'string' || typeof keep === 'number' ) {
      if( typeof kepp === 'string' && keep.indexOf('|') > -1 ) {
        const tokeep = keep.split('|');
        for(const v in value ) {
          if( ! tokeep.includes(v) ) {
            delete value[v];
          }
        }
      } else {
        const tokeep = keep;
        for(const v in value ) {
          if( tokeep !== parseInt(v) ) {
            delete value[v];
          }
        }
      }
    }
    return value;

  } 

  /**
   * Add attributes
   * @param {object} element
   * @param {object} prop
   */
  static addProp(element, prop) {
    if (typeof element[0] === "undefined" || element == null) {
      return;
    }
    for (const p in prop) {
      if ( typeof prop[p] === "undefined" || prop[p].length === 0) {
        continue;
      } else {
        let prev = element[0].className;
        switch (p) {
          case "font":
            element[0].style.fontFamily = prop[p];
            break;
          case "width":
            element[0].style.width = prop[p];
            break;
          case "height":
            element[0].style.height = prop[p];
            break;
          case 'autop':
            element[0].className = prev + ' has-autop';
            break;
          case 'indent':
            element[0].style.className = prev + ' has-indent'
            break;
        }
      }
    }
  }

  /**
   * 
   * @param {string} link 
   * @returns boolean
   */
  static testEmail( link ) {
    const regex = /[a-zA-Z0-9-_|#$%&'\/=^`{}~]+@[a-zA-Z0-9\.]+/gm;
    return regex.test(link);
  }

  /**
   * is not a uniqe id generator
   * 
   * based on script of codemizy.com
   * source: https://www.codemzy.com/blog/random-unique-id-javascript
   * 
   * @param {string} string
   * @param {int}    length
   * @returns
   */
  static randomString(string, length) {
    const t = string.toString(36).substring(2, length + 2),
          d = Date.now()
              .toString(36)
              .substring(2, length + 2),
          m = Math.random()
      .toString(36)
      .substring(2, length + 2);
    string = m + t + d;
    return string.replace(/\./g, '');
  }

  /**
   * Tab indent in textarea
   * Credits: https://stackoverflow.com/a/6637396/7604255
   * License: https://creativecommons.org/licenses/by-sa/4.0/
   * @param {string} id 
   * @param {bool} indent
   */
  static textareaIndent( id, indent ) {

    document.getElementById(id).addEventListener('keydown', function(e) {
      if (e.key == 'Tab' && indent === true ) {
        e.preventDefault();
        const start = this.selectionStart,
              end = this.selectionEnd;
    
        // set textarea value to: text before caret + tab + text after caret
        this.value = this.value.substring(0, start) +
          "\t" + this.value.substring(end);
    
        // put caret at right position again
        this.selectionStart =
        this.selectionEnd = start + 1;
      }
    });
  }

  /**
   * Convert hsl to hex color
   * credits: https://stackoverflow.com/posts/44134328/, https://stackoverflow.com/a/75003992/7604255
   * License: https://creativecommons.org/licenses/by-sa/4.0/ (CCBYSA 4.0)
   * @param {*} h 
   * @param {*} s 
   * @param {*} l 
   * @param {*} alpha 
   * @returns 
   */
  static hsl2hex(h,s,l,alpha) {
      l /= 100;
      const a = s * Math.min(l, 1 - l) / 100;
      const f = function(n) {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   
        // convert to Hex and prefix "0" if needed
      };
    //alpha conversion
    alpha = Math.round(alpha * 255).toString(16).padStart(2, '0');

    // ignore alpha if is equal 'ff'
    if( alpha === 'ff') {
      alpha = '';
    }

    return `#${f(0)}${f(8)}${f(4)}${alpha}`;
  }

  /**
   * Generate palette of colors
   * @param {int} s 
   * @param {int} l 
   * @param {int} alpha 
   * @param {array} filter
   */
  static colorPalette(s = 100, l = 85, alpha = 1, filter = {} ) {

    const hexColors = [];
    for( let i = 1; i <= 10; i++) {
      Array(360).fill(0).forEach( function(e,h) {
        const color = Jbbed.hsl2hex(h,s,l/i,alpha);
        hexColors['p' + color.substring(1)] = color;
      });
    }
    
    l = 100;
    const hexGrey = [];
    Array(360).fill(0).forEach( function(e,h) {
      if( l > -1 ) {
    		const grey = Jbbed.hsl2hex(h,0,l,alpha);
      	l--;
     		hexGrey['p' + grey.substring(1)] = grey;
      }
    });
    const colors = Object.assign(hexColors, hexGrey);

    if(Object.entries(filter).length > 0) {
      let newColors = {};
      for( let c in colors ) {
        if(typeof filter[c] !== 'undefined') {
          newColors[c] = colors[c];
        }
      }
      return newColors;
    }

    return colors;
   
  }

  /**
   * 
   * @param {object} colors 
   * @returns 
   */
  static filterColors( colors = {} ) {
    return Jbbed.colorPalette(100,50,1, colors);
  }

  /**
   * Cut the string with separator
   * 
   * @param {string} string 
   * @param {string} sep 
   * @param {number} limit 
   * @returns array or string
   */
  static cutString(string, sep, limit) {
  
    const p = string.split(sep, limit);
    const s = p.join(sep);
    const l = string.substring(s.length+sep.length);
    return l.length > 0 ? [s, l] : p;
  }
  
  /**
   * Explode string with limit
   * 
   * @param {string|array} element 
   * @param {string} sep 
   * @param {number} limit 
   * @returns mixed array or false
   */
  static explodeString( element, sep, limit ) {
    
    if( typeof element === 'string' ) {
      return element.indexOf(sep) ? Jbbed.cutString( element.trim(), sep, limit ) : [];
    }

    return element;
    
  }

  /**
   * Generate emoji
   * @param {array} selected 
   * @returns array
   */
  static getEmoji( selected = [], number = false) {
    selected = Jbbed.explodeString(selected, '|');
    const emoji = [];
    let n = 0;
    for (let i = 128512; i <= 128567; i++){
      let e = number === false ? '&#' + i + ';' : i;
      if( Array.isArray(selected) && selected.length > 0 ) {
        if( selected.includes(e) ) {
        	 emoji[+n] = e;
        }
      } else {
      	emoji[+n] = e;
      }
      n++;
    }
    return emoji;
  }

} // end class
