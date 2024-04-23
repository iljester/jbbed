/**
 * jbbed
 * @author Davide Mura (thejester72@gmail.com)
 * (c) 2024
 * @version 1.0
 * 
 * buttons available not by default: xpost.
 */

(function ( $ ) {

  $.fn.jbbed = function (params = {}) {

    // init class
    let inst = new jbbed( $(this), params );

    // add class to textarea
    $(this).addClass("jbbed-editor");

    // html containers
    let main_container    = jbbed.mainContainer;
    let preview_container = jbbed.previewContainer;
    let buttons_container = jbbed.buttonsContainer;
    let emoji_container   = jbbed.emojiContainer;

    // add buttons container
    $(buttons_container).insertBefore(this);

    // add wrap container
    if (inst.container === true) {
      $(this).prev().wrap(main_container); // wrap buttons into main_container
      $(this).prev().append(this); // append editor textarea
    }

    if (inst.showPreview === true) {
      $(preview_container).append(this.val()).insertAfter(this);
      // add tabs
      inst.tabs($);
    }

    // add attributes to textarea and previews
    inst.addAttributes($);

    // create buttons
    inst.buttonsFactory($);

    // add emoji container
    if (inst.emoji !== false) {
      $(".jbbed-buttons-container").append(emoji_container);
      $(".jbbed-emoji-container").prepend('<span class="jbbed-toggle close"></span>');
    }

    // add emoji
    inst.emojiFactory($);

    // set data position
    inst.setDataPosition($);

    // do BBCode
    inst.putBBCode($);

    // preview
    inst.getPreview($);
  };

}(jQuery));

/**
 * Class to build BBCode
 */
class jbbed {
  
  static mainContainer = '<div class="jbbed-container"></div>';
  static previewContainer = '<div class="jbbed-preview" style="display:none;"></div>';
  static buttonsContainer = '<div class="jbbed-buttons-container"></div>';
  static emojiContainer = '<div class="jbbed-emoji-container"><div></div></div>';

  static defaults = {
    bars: {
      1: "b|i|u|link|img|hr|ol|ul|li|quote|code|vid",
      2: "size|color|font",
    },
    keepBars: true,
    selectiveRemove: '',
    modal: "link|img|vid|xpost",
    single: "br|hr|img|emoji|vid|xpost",
    select: {
      size: "10|12|14|16|18|20|22|24|26|28|30",
      color: "Black:#000000|Green:#008000|Blue:#0000ff|Purple:#800080|Red:#ff0000|Orange:#ffa500|Pink:#ffc0cb|Yellow:#ffff00",
      font: "Arial|Times New Roman|Lucida Sans|Roboto"
    },
    keepSelect: true,
    selectAttr: "size|color|font",
    video: {
      youtube: "560|315",
      rumble: "640|360",
    },
    sizeUnit: "px",
    tagAttrs: {
      size: 'span|style="font-size:$1"',
      font: 'span|style="font-family:$1"',
      color:'span|style="color:$1"',
      link: 'a|href="$1"',
      img:  'img|src="$1"',
      quote: 'blockquote',
      code: 'pre'
    },
    filterAttrs: {
      size: "[a-zA-Z0-9]+",
      font: "[a-zA-Z0-9]+",
      color: "[a-fA-F0-9#]+",
      img: "[^<>\\s]+",
      link: "[^<>\\]\\[\\s]+",
    },
    propTextarea: {
      font: "monospace",
      cols: 50,
      rows: 10,
    },
    propPreview: {
      font: "sans-serif",
      width: "",
      height: "",
    },
    emoji: true,
    container: true,
    showPreview: true,
    localize: {
      size: 'Size',
      font: 'Font',
      heads: 'Head',
      color: 'Color',
      code: 'Code',
      quote: 'Quote',
      vid: 'Vid',
      xpost: 'XPost',
      edit: 'Edit',
      preview: 'Preview',
      promptUrl: 'Insert an url or email address:',
      promptVideo: 'Insert a video ($1):',
      promptImg: 'Insert an image url:'
    },
  };

  /**
   * The constructor
   * @param {object} editor
   * @param {object} params
   * @param {object} defaults
   */
  constructor(editor, params) {
    this.editor = editor;
    this.params = params;

    let g = jbbed.parseValues(this.params, jbbed.defaults);

    this.bars = g.bars;
    this.keepBars = g.keepBars;
    this.selectiveRemove = g.selectiveRemove;
    this.modal = g.modal;
    this.single = g.single;
    this.container = g.container;
    this.emoji = g.emoji;
    this.sizeUnit = g.sizeUnit;
    this.video = g.video;
    this.showPreview = g.showPreview;
    this.select = g.select;
    this.keepSelect = g.keepSelect;
    this.selectAttr = g.selectAttr;
    this.inselect = Object.getOwnPropertyNames(this.select);
    this.tagAttrs = g.tagAttrs;
    this.filterAttrs = g.filterAttrs;
    this.propTextarea = g.propTextarea;
    this.propPreview = g.propPreview;
    this.localize = g.localize;

    this.allowed = jbbed.buildAllowedTags(this.bars, this.selectiveRemove);
  }

  /**
   * Add attributes
   * 
   * @param object $ // jQuery object
   */
  addAttributes( $ ) {
    this.preview = this.editor.next(".jbbed-preview");
    jbbed.addProp(this.editor, this.propTextarea);
    jbbed.addProp(this.preview, this.propPreview);
  }

  /**
   * Add buttons
   * 
   * @param object $ // jQuery object
   */
  buttonsFactory( $ ) {
    let bars = this.bars;
    let inselect = this.inselect;
    let select = this.select;
    let sizeUnit = this.sizeUnit;
    let i = 0;

    for (let bar in bars) {
      if (bars[bar].trim().length === 0) {
        continue;
      }
      let buttons = bars[bar].split("|");
      let first = i === 0 ? ' jbbed-first-bar' : '';
      let last = i === Object.entries(bars).length ? 'jbbed-last-bar' : ''; i++;
      
      $(".jbbed-buttons-container").append('<div class="jbbed-bar jbbed-bar-' + bar + first + last + '"></div>');
      for (let b in buttons) {
        if( ! this.allowed.includes(buttons[b]) ) {
          continue;
        }
        let label = jbbed.localize(this.localize, buttons[b]);
        if (inselect.includes(buttons[b])) {
          // selections
          let values = select[buttons[b]].split("|");
          let options = "";
          for (let v in values) {
            let name = values[v];
            let value = values[v];
            if (values[v].search(":") > 0) {
              values[v] = values[v].split(":");
              name = values[v][0];
              value = values[v][1];
            }
            if (buttons[b] == "size") {
              name = values[v] + sizeUnit;
            }
            options += '<option value="' + value + '">' + name + "</option>";
          }
          let none = '<option value="">' + "--" + "</option>";
          $(".jbbed-bar-" + bar).append(
            '<label class="jbbed-label" >' + label + ': <select class="jbbed-button-select ' + buttons[b] + '-button" data-button="' + buttons[b] + '">' + none + options + '</select></label>'
          );
        } else {
          $(".jbbed-bar-" + bar).append(
            '<span data-button="' + buttons[b] + '" class="jbbed-button ' + buttons[b] + '-button">' + label + '</span>'
          );
        }
      }
    }

    $('.jbbed-bar').each(function() {
      if( $(this).is(':empty') ) {
        $(this).remove();
      }
    });

  }

  /**
   * Add emoji
   *
   * @param object $ // jQuery object
   */
  emojiFactory( $ ) {
    let emoji = this.emoji;

    let all = "";
    if (emoji == true) {
      for (let i = 128512; i <= 128567; i++) {
        all += '<span class="jbbed-button jbbed-emoji" data-button="emoji" data-emoji="' + i + '">&#' + i + ";</span>&nbsp;";
      }
    } else if (typeof emoji !== "boolean") {
      all = emoji.split("|");
      for (let i = 0; i < all.length; i++) {
        all += '<span class="jbbed-button jbbed-emoji" data-button="emoji" data-emoji="' + i + '">&#' + i + ";</span>";
      }
    }
    $(".jbbed-emoji-container div").html(all);

    let h = $('.jbbed-emoji-container div').height();
    $('.jbbed-emoji-container div').css('height', '28px');
    $('.jbbed-toggle').on('click', function() {
      if( $(this).hasClass('open')) {
        $(this).next().animate({
          'height' : '28px'
        }, 400)
        $(this).addClass('close').removeClass('open');
      } else {
        $(this).next().animate({
          'height' : h + 'px'
        }, 400)
        $(this).addClass('open').removeClass('close');
      }
    });
  }

  /**
   * Add tabs to switch editor -> preview
   * 
   * @param object $ // jQuery object
   */
  tabs( $ ) {
    let label_edit = jbbed.localize(this.localize, 'edit');
    let label_preview = jbbed.localize(this.localize, 'preview');;
    let tabs = '<ul class="jbbed-tab-editor"><li class="tab editor active">' + label_edit + '</li><li class="tab preview">' + label_preview + '</li></ul>';
    let editor = this.editor;
    $(tabs).insertBefore(editor);
    let tab_btn = editor.prev().children("li");
    let preview = editor.next();
    editor.wrap('<div class="jbbed-wrapper-tab"></div>');
    editor.parent().append(preview);
    $(tab_btn).on("click", function () {
      let tab_button = editor.parent().prev().children("li");
      tab_button.removeClass("active");
      $(this).addClass("active");
      if ($(this).hasClass("editor")) {
        editor.show();
        preview.hide();
      } else {
        editor.hide();
        preview.show();
      }
    });
  }

  /**
   * Set position caret
   */
  setDataPosition( $ ) {
    let editor = this.editor;

    // set data start and end
    editor.attr("data-start", 0);
    editor.attr("data-end", 0);

    // select string and stored positions
    editor.on("select click keyup keydown", function () {
      let start = $(this)[0].selectionStart;
      let end = $(this)[0].selectionEnd;
      $(this).attr("data-start", start);
      $(this).attr("data-end", end);
    });
  }

  /**
   * Create BBCode and put in textarea
   */
  bbCodeFactory(thisButton) {
    let modal = this.modal;
    let inselect = this.inselect;
    let single = this.single;
    let sizeUnit = this.sizeUnit;
    let localize = this.localize;

    let tag = thisButton.attr("data-button");
    let emoji_code = thisButton.attr("data-emoji");
    let myeditor = "";
    if (this.showPreview === true) {
      myeditor = thisButton
        .closest(".jbbed-buttons-container")
        .next()
        .next()
        .children(".jbbed-editor");
    } else {
      myeditor = thisButton.closest(".jbbed-buttons-container").next();
    }
    let start = myeditor.attr("data-start");
    let end = myeditor.attr("data-end");
    let sel = myeditor.val().substring(start, end);

    // add prompt for urls
    let attr = "";
    let modals = modal.split("|");
    if (modals.includes(tag)) {
	  let message = localize.promptUrl;
	  if( tag === 'vid') {
		  let names = Object.keys(this.video).join(', ').trim(',');
		  message = localize.promptVideo.replace('$1', names );
	  } 
	  else if( tag === 'img') {
		  message = localize.promptImg;
	  }
      attr = prompt(message, "");
    }

    // if src is unset or empty, return false
    if (modals.includes(tag) && attr === null) {
      return false;
    } else if (modals.includes(tag) && attr.trim() === "") {
      return false;
    } else {
      attr = modals.includes(tag) ? "=" + attr : attr;
    }

    // for select buttons
    let hasAttr = this.selectAttr.split("|");
    if (inselect.includes(tag)) {
      let value = thisButton.val().trim();
      if (hasAttr.includes(tag) && value !== "") {
        attr = "=" + value + (tag === "size" ? sizeUnit : "");
      } else if (!hasAttr.includes(tag) && value !== "") {
        this.allowed = this.allowed.replace(tag, value);
        tag = value;
      } else {
        return false;
      }
    }

    // create tag BB
    let wrap = "[" + tag + attr + "]" + sel + "[/" + tag + "]";
    let taglen = "[" + tag + attr + "][/" + tag + "]";

    // check if is a single tag
    let singles = single.split("|");
    if (singles.includes(tag)) {
      if (tag !== "emoji") {
        wrap = sel + "[" + tag + attr + "]";
        taglen = "[" + tag + attr + "]";
      } else {
        wrap = "&#" + emoji_code + ";";
        taglen = wrap;
      }
    }

    // split textarea string
    let before = myeditor.val().substring(0, start);
    let after = myeditor.val().substring(end);

    // rebuild textare value with bbcode tags
    let value = before + wrap + after;

    // reset data
    myeditor.val(value).attr("data-start", 0).attr("data-end", 0);

    // position caret at the end of tag
    myeditor[0].selectionEnd = +end + taglen.length;
    myeditor[0].focus({ preventScroll: true });
  }

  /**
   * Put bbtag in textarea
   * 
   * @param object $ // jQuery object
   */
  putBBCode( $ ) {
    let thisClass = this;
    $(document).on("click", ".jbbed-button", function () {
      thisClass.bbCodeFactory($(this));
    });

    $(document).on("change", ".jbbed-button-select", function () {
      thisClass.bbCodeFactory($(this));
    });
  }

  /**
   * Get Preview
   * 
   * @param object $ // jQuery object
   */
  getPreview( $ ) {
    let textarea = this.editor;
    let thisClass = this;

    $(document).on(
      "click change keyup keydown",
      ".jbbed-button, .jbbed-button-select, .jbbed-editor",
      function (e) {
        let string = textarea.val();
        // convert tag html and add br
        string = string
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\r?\n/g, "<br />");
        // decode bbtags
        let newstring = jbbed.convert(
          string,
          thisClass.allowed.join('|'),
          thisClass.tagAttrs,
          thisClass.filterAttrs,
          thisClass.video
        );
        $(".jbbed-preview").html(newstring);
      }
    );
  }

  /**
   * Convert tag BB in html tag
   * @param {string} string
   * @param {string} allowed
   * @returns string
   */
  static convert(
    string,
    allowed = "",
    tagAttrs = {},
    filterAttrs = {},
    video_params = {}
  ) {
    if (typeof string === "undefined") {
      return;
    }
    let newstring = string;

    // check if tag is allowed
    if (allowed.toString().trim().length > 0) {
      let regex = new RegExp("\\[\\/?(" + allowed + ")\\s*(.*?)\\]", "gm");
      let matches = string.match(regex);
      for (let m in matches) {
        let to = matches[m].slice(1, -1);
        newstring = newstring.replace("[" + to + "]", "###" + to + "###");
      }
      // remove unallowed bbtags
      newstring = newstring.replace(/\[(\/?[a-z0-9]+)(=(.*?))?\]/g, "");
      // restore bbtag for allowed tags
      newstring = newstring.replace(/\/?###(.*?)###/g, "[$1]");
    }

    // convert tags with attributes or alias tags
    for (let t in tagAttrs) {
      // with attributes
      if( tagAttrs[t].indexOf('|') > -1 ) {
        let attrs = tagAttrs[t].split("|");
        let tag = attrs[0];
        let open = attrs[1];
        let close = "/" + tag;
        let filter = ".*?";
        if (typeof filterAttrs[t] !== "undefined") {
          filter = filterAttrs[t];
        }
        let regex = new RegExp("\\[(" + t + ")=(" + filter + ")\\]", "gm");
        let matches = newstring.matchAll(regex);
        for (let m of matches) {
          let value = m[2];
          open = open.replace("$1", value);
          let to = m[0].slice(1, -1);
          newstring = newstring.replace(
            "[" + to + "]",
            "<" + tag + " " + open + ">"
          );
          newstring = newstring.replace("[/" + t + "]", "<" + close + ">");
        }
      } 
      else if( t !== tagAttrs[t] ) {
        newstring = newstring.replace("[" + t + "]", "<" + tagAttrs[t] + ">");
        newstring = newstring.replace("[/" + t + "]", "</" + tagAttrs[t] + ">");
      }
    }

    // convert video
    let matches = newstring.matchAll(/\[vid=([^<>\]\[\s]+)\]/g);
    for (let v of matches) {
      let iframe = jbbed.getVideo(v[1], video_params);
      newstring = newstring.replace(v[0], iframe);
    }

    // xpost
    let xpost = newstring.matchAll(/\[xpost=([^<>\]\[\s]+)\]/g);
    for (let v of xpost) {
      let r = Math.random();
      let id = jbbed.randomString(r, 5);
      newstring = newstring.replace(v[0], jbbed.xpostContainer(id));
      jbbed.xpost(v[1], id);
    }

    // convert tags without attrs
    newstring = newstring.replace(/\[(\/?[a-z0-9]+)(=(.*?))?\]/g, "<$1$2>");

    return newstring;
  }

  /**
   * Get video. Supported Youtube and Rumble
   * @param {string} url
   * @param {object} params
   * @returns string
   */
  static getVideo(url, params = {}) {
    if (
      url.trim().length === 0 ||
      typeof url === "undefined" ||
      url === "null"
    ) {
      return;
    }

    let iframe = "";
    const parse_url = new URL(url);

    let pattern_yt = /(www\.)?youtu(\.)?be(\.com)?/g;
    let test_yt = pattern_yt.test(url);

    let pattern_rum = /(www\.)?rumble\.com/g;
    let test_rum = pattern_rum.test(url);

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

      let attrs = params.youtube.split("|");
      let width = attrs[0];
      let height = attrs[1];
      let src =
        "https://www.youtube-nocookie.com/embed/" + code + "?controls=1";

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

      let attrs = params.rumble.split("|");
      let width = attrs[0];
      let height = attrs[1];
      let src = "https://rumble.com/embed/" + code + "/?pub=4";

      iframe =
        '<iframe class="rumble" width="' + width + '" height="' + height + '" src="' +
        src +
        '" frameborder="0" allowfullscreen></iframe>';
    }

    return iframe;
  }

  /**
   * Create xpost container
   * @param {string} id
   * @returns string
   */
  static xpostContainer(id) {
    let el = document.createElement("div");
    el.id = id;
    return el.outerHTML;
  }

  /**
   * Xpost Generator
   * docs: https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/overview
   * 
   * @params {string} url
   * @params [string] id
   */
  static xpost(url, id) {

    const parse_url = new URL(url);
    let path = parse_url.pathname.split('/');
    let tid = path.slice(-1)[0];

    window.twttr = (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0],
        t = window.twttr || {};
      if (d.getElementById(id)) return t;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://platform.twitter.com/widgets.js";
      fjs.parentNode.insertBefore(js, fjs);
      t._e = [];

      t.ready = function (f) {
        t._e.push(f);
      };
      return t;
    })(document, "script", "twitter-wjs");

    twttr.ready(function (twttr) {
      twttr.widgets
        .createTweet(tid, document.getElementById(id), {
          theme: "light", //or dark
          conversation: "none",
          dnt: true,
        })
        .then(function (el) {
          //console.log("Tweet added.");
        });
    });
  }

  /**
   * Parse values
   * @param {object} params 
   * @param {object} defaults 
   * @returns 
   */
  static parseValues( params, defaults ) {

    let sep = "";

    for (let d in defaults) {
      if (typeof params[d] == "undefined") {
        params[d] = defaults[d];
      }
    }

    // keep default buttons if true
    if (params.keepBars === true) {
      params.bars = jbbed.keepMerge(params.bars, defaults.bars);
    }

    // merge single
    sep = params.single.trim().length > 0 ? "|" : "";
    params.single = defaults.single + sep + params.single.trim();

    // merge select Attributes
    sep = params.modal.trim().length > 0 ? "|" : "";
    params.modal = defaults.modal + sep + params.modal.trim();

    // merge select Attributes
    sep = params.selectAttr.trim().length > 0 ? "|" : "";
    params.selectAttr = defaults.selectAttr + sep + params.selectAttr.trim();

    if (params.keepBars === true) {
      params.bars = jbbed.keepMerge(params.bars, defaults.bars);
    }

    // keep default select if true
    if (params.keepSelect === true) {
      params.select = jbbed.keepMerge(params.select, defaults.select);
    }

    // merge tag Attrs
    params.tagAttrs = jbbed.keepMerge(params.tagAttrs, defaults.tagAttrs);

    for( let d in defaults.localize) {
      if( typeof params.localize[d] === 'undefined' || (typeof params.localize[d] !== 'undefined' && params.localize[d].trim() === '' ) ) {
        params.localize[d] = defaults.localize[d];
      }
    }

    // merge video
    for( let d in defaults.video) {
      if( typeof params.video[d] === 'undefined' || (typeof params.video[d] !== 'undefined' && params.video[d].trim() === '' ) ) {
        params.video[d] = defaults.video[d];
      }
    }

    // merge filter Attrs
    params.filterAttrs = jbbed.keepMerge(
      params.filterAttrs,
      defaults.filterAttrs
    );

    return params;
  }

  /**
   * Build allowed tags
   * @param {object} bars 
   * @param {object} selectiveRemove 
   * @returns 
   */
  static buildAllowedTags( bars, selectiveRemove) {
    let allowed = [];
    let to_remove = selectiveRemove.split('|');
    for (let b in bars) {
      let buttons = bars[b].split('|');
      for( let i in buttons ) {
        if( to_remove.includes(buttons[i] ) ) {
          continue;
        } else {
          allowed.push(buttons[i]);
        }
      }
    }
    return allowed;
  }

  /**
   * Keep merge values
   * @param {object} value_1
   * @param {object} value_2
   * @returns object
   */
  static keepMerge(value_1, value_2, assign = true) {
    if (assign === true) {
      value_1 = Object.assign({}, value_2, value_1);
    }
    for (let v in value_1) {
      if (typeof value_2[v] !== "undefined" && value_2[v] !== value_1[v]) {
        let sep = value_1[v].trim().length > 0 ? "|" : "";
        value_1[v] = value_2[v] + sep + value_1[v].trim();
      }
    }
    return value_1;
  }

  /**
   * Add attributes
   * @param {object} element
   * @param {object} prop
   */
  static addProp(element, prop) {
    if (typeof element === "undefined" || element == null) {
      return;
    }
    for (let p in prop) {
      if (prop[p] === "undefined" || prop[p] === "") {
        continue;
      } else {
        switch (p) {
          case "font":
            element.css("font-family", prop[p]);
            break;
          default:
            element.attr(p, prop[p]);
        }
      }
    }
  }

  /**
   * is not a uniqe id generator
   */
  static randomString(string, length) {
    let t = string.toString(36).substring(2, length + 2);
    let d = Date.now()
      .toString(36)
      .substring(2, length + 2);
    let m = Math.random()
      .toString(36)
      .substring(2, length + 2);
    return m + t + d;
  }

  /**
   * Localize buttons and tabs
   * @param {object} localize 
   * @param {string} string 
   * @returns 
   */
  static localize( localize, string  ) {
    if( typeof localize[string] !== 'undefined' &&  localize[string].trim() !== '' ) {
      string = localize[string];
    }
    return string;
  }
}

/**
 * Alone function to convert jbbed
 * @param {string} string 
 * @param {string} allowed 
 * @param {object} tagAttrs 
 * @param {object} filterAttrs 
 * @param {object} video_params 
 * @returns 
 */
function convertjbbed(string, allowed, tagAttrs, filterAttrs, video_params) {
  return jbbed.convert(string, allowed, tagAttrs, filterAttrs, video_params);
}
