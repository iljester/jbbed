<?php
/**
 * jbbed php processor
 * Convert bbcode in html tags
 * @author iljester <thejester72@gmail.com>
 * @web https://github.com/iljester, www.iljester.com
 * @package jbbed editor plugin
 * (c) 2024
 * @version 1.0beta
 */

 class jbbedDecode {
	
    /**
     * Default args
     */
	public $defaults = array(
        'tags' => 'b|i|u|s|link|img|hr|ol|ul|li|quote|code|size|color|font|vid|emoji|spoiler|h|jsf|alignleft|alignright|aligncenter',
        'tagTranslate'  => array(
			'size' 			=> ['span', 'style="font-size:$1"', "[a-zA-Z0-9]+"],
			'font' 			=> ['span', 'style="font-family:$1"', "[a-zA-Z0-9\\s]+"],
			'color' 		=> ['span', 'style="color:$1"', "[a-fA-F0-9#]+"],
			'link' 			=> ['a', 'href="$1"', "[^<>\\]\\[\\s]+"],
			'img' 			=> ['img', 'src="$1"', "[^<>\\s]+"],
			'quote' 		=> ['blockquote', '', ''],
			'code' 			=> ['pre', '', ''],
			'b'			    => ['strong', '', ''],
			'i'				=> ['em', '', ''],
			'aligncenter' 	=> ['p', 'style="text-align:center"', ''],
			'alignleft' 	=> ['p', 'style="text-align:left"', ''],
			'alignright' 	=> ['p', 'style="text-align:right"', ''],
			'alignjustify' 	=> ['p', 'style="text-align:justify"', ''],
			'spoiler' 		=> ['div', 'style="display:none" class="jbbed-spoiler"', '']
        ),
		// for noWrapP, you can use string style, using | as separator (i.e., ul|ol|h1 etc.)
      	'noWrapP' 		=> ['ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'div'],
      	'noTagIntoTag' 	=> ['strong', 'u', 'i', 'em', 'spoiler', 'a'],
        'video' => array(
            'youtube' => "560|315",
            'rumble' => "640|360",
		),
		'jsfPlay' => array(
			'output' => 'js', // html|css|js|result or all
			'theme' => 'dark' // dark or ''
		)
    );
    
    /**
     * String
     */
    public $string = '';

    /**
     * Args passed
     */
    public $args = [];

    /**
     * Replace tags
     */
    public $replace = false;

    /**
     * Remove selective tags
     */
    public $remove = '';

    /**
     * Youtube iframe
     */
    public static $youtube_iframe = '<iframe width="$1" height="$2" src="$3" title ="Youtube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
	
    /**
     * Rumlbe iframe
     */
    public static $rumble_iframe = '<iframe class="rumble" width="$1" height="$2" src="$3" frameborder="0" allowfullscreen></iframe>';
	
	/**
     * The constructor
     * 
     * @param string $string
     * @param array $args
     * @param bool $replace
     * @param string $remove
     */
	public function __construct( $string = '', $args = [], $replace = false, $remove = ''  ) {
		$this->string = $string;
		$this->args = $args;
		$this->replace = $replace;
		$this->remove = $remove;
		$this->_prepare();
	}

	/**
     * Parse arguments
     * @return void
     */
	protected function _prepare() {
	
	    $defaults = $this->defaults;
	    $replace = $this->replace;
	    $args = $this->args;
	
		$new_args = [];
	    foreach( $defaults as $param => $values ) {
	        switch( $param ) {
	            case 'tags' : 
	            	if( (bool) $replace === false ) {
	            		$new_args[$param] = isset( $args[$param] ) ? $values . '|' . $args[$param] : $values;
	            	} else {
	            		$new_args[$param] = $args[$param];
	            	}
	            	
	            break;
	            case 'video' :
	        		if(  isset( $args[$param]) && is_array( $args[$param])  ) {
	        			$new_args[$param] = array_merge( $values, $args[$param]);
	        		} else {
	        			$new_args[$param] = $values;
	        		}
	        		break;
	        	case 'tagTranslate' :
	        		if(  isset( $args[$param]) && is_array( $args[$param])  ) {
	        			foreach( array_keys( $defaults[$param]) as $v ) {
		        			if( false !== array_key_exists( $v, $args[$param]) ) {
		        				unset( $args[$param][$v] );
		        			}
	        			}
	        			$new_args[$param] = array_merge( $values, $args[$param]);
	        		} else {
	        			$new_args[$param] = $values;
	        		}
	        	break;
				case 'noWrapP' : 
					if(  isset( $args[$param]) && is_array( $args[$param])  ) {
	        			$new_args[$param] = array_merge( $values, $args[$param]);
	        		} else {
	        			$new_args[$param] = $values;
	        		}
	        		break;
				case 'noTagIntoTag' : 
					if(  isset( $args[$param]) && is_array( $args[$param])  ) {
						$new_args[$param] = array_merge( $values, $args[$param]);
					} else {
						$new_args[$param] = $values;
					}
					break;
				case 'jsfPlay' :
					if(  isset( $args[$param]) && is_array( $args[$param])  ) {
	        			$new_args[$param] = array_merge( $values, $args[$param]);
	        		} else {
	        			$new_args[$param] = $values;
	        		}
				break;
	        }
	    }
	    
	    $this->args = $new_args;
	
	}
	
    /**
     * Remove illegal chars
     * @return void
     */
	protected function _clearString() {
		$string = $this->string;
		
		// remove illegal chars into tag BB
		preg_match_all( '/\[(.*?)\]/', $string, $match );
		$n_match = [];
		$bb_tags = $match[0];
		foreach( $bb_tags as $m ) {
			$m = preg_replace("/['\"<>\(\)\[\]\$!]/", '', $m);
			$n_match[] = '[' . $m . ']';
		}
		$n_string = str_replace( $match[0], $n_match, $string );

		// encode all content into code tags
		preg_match_all('/\[code\](.*?)\[\/code\]/ms', $n_string, $matches );
		$content_code = $matches[1];
		$encode = [];
		foreach( $content_code as $content ) {
			$encode[] = base64_encode( $content );
		}
		$n_string = str_replace( $content_code, $encode, $n_string );

		// encode all special chars
		$n_string = htmlspecialchars($n_string, ENT_QUOTES, 'UTF-8');
		
		// remove new lines into ul/ol
		$re = '/((\[ol|ul|li\])\n\r|\r|\n|\s{1,})(\[\/?(ol|ul|li)])/m';
		$n_string = preg_replace($re, '$3', $n_string);

		$this->string = $n_string;
	}
	
    /**
     * Selective remove tags
     * @return void
     */
	protected function _remove() {
		
		$removes = explode('|', $this->remove);
	    
	    if( ! empty( $removes ) ) {
	    	$e_args = explode( '|', $this->args['tags'] );
		    foreach( $e_args  as $k => $value ) {
		    	if( in_array( $value, $removes ) ) {
		    		unset( $e_args[$k] );
		    	}
		    }
		    $this->args['tags'] = implode('|', $e_args);
	    }
		
	}

	/**
	 * Add gist
	 * @param string $url
	 * @return string
	 */
    protected function _jsf( $url ) {
		$jsf = $this->args['jsfPlay'];

		$display = stripos( '|', $jsf['output'] ) !== false ? '/' . str_replace('|', ',', $jsf['output']) :  '/' . $jsf['output'];
		if( $jsf['output'] === 'all' ) {
			$display = '/';
		}

		$theme = '/' . $jsf['theme'];
		if( $jsf['theme'] !== 'dark') {
			$theme = '/';
		}

		$src = $url . 'embed' . $display . $theme;
		$id = self::uniqidReal(6);
		return '<script id="' . $id . '" src="' . htmlspecialchars( $src ) . '/"></script>';
	}
	
    /**
     * Get video
	 * 
	 * @param string $url // the url video
	 * @param string $k // loop key
	 * 
     * @return string
     */
	protected function _getVideo( $url, $k ) {

		$video = $this->args['video'];
		
		$parse_url = parse_url( $url );
		$host = str_replace( ['www.', '.com'], '', $parse_url['host'] );
		$vid = $k;
	
		switch( $host ) {
			case 'rumble' :
				$code = substr( $parse_url['path'], 7, -1 );
				$video_attrs = explode( '|', $video['rumble'] );
				$width = $video_attrs[0];
				$height = $video_attrs[1];
				$attrs = [];
				$attrs[] = $width;
				$attrs[] = $height;
				$attrs[] = "https://rumble.com/embed/{$code}/?pub=4";
				$iframe = str_replace( ['$1', '$2', '$3'], $attrs, self::$rumble_iframe );
				if( $code !== '' ) {
					$vid = $iframe;
				}
				break;
			case 'youtu.be' || 'youtube' || 'youtube-nocookie' : 
				$code = '';
				if( $host === 'youtu.be') {
					$code = substr( $parse_url['path'], 1 );
				} 
				elseif( $host === 'youtube') {
					if( !isset( $parse_url['query'] ) ) {
						break;
					}
					$query = $parse_url['query'];
					parse_str( $query, $output );
					if( !isset( $output['v'] ) ) {
						$code = substr( $parse_url['path'], 7 );
					} else {
						$code = $output['v'];
					}
				}
				$video_attrs = explode( '|', $video['youtube'] );
				$width = $video_attrs[0];
				$height = $video_attrs[1];
				$attrs = [];
				$attrs[] = $width;
				$attrs[] = $height;
				$attrs[] =  "https://www.youtube-nocookie.com/embed/{$code}?controls=1"; 
				$iframe = str_replace( ['$1', '$2', '$3'], $attrs, self::$youtube_iframe );
                
				if( $code !== '' ) {
					$vid = $iframe;
				}
				break;
		}
		
		return $vid;
	    
	}
	
    /**
     * Get html for tags
	 * 
	 * @param string $tagAttr // the html attributes
	 * @param string $value // value to pass
	 * @param string $bbTag // tag BB
	 * 
     * @return array
     */
	protected function _getHtml( $tagTranslate = '', $value = '', $bbTag = '' ) {

		$tag_html = trim( $tagTranslate[0] );
		$tag_attr = strlen( trim( $tagTranslate[1] ) ) === 0 ? '' : ' ' . trim( $tagTranslate[1] );
		
		$attr = str_replace( '$1', $value, $tag_attr );
		$html = ['<' . $tag_html . $attr . '>', '</' . $tag_html . '>'];
		
		return $html;
		
	}


	/**
	 * Add p
	 * @param string $string
	 */
	protected function _autop( $string ) {

	    // remove previous p
	    $newstring = preg_replace('/<\/?p>/m', '', $string);
	
	    // list of html block elements
	    $arr = $this->args['noWrapP'];
	
		$string_arr = is_array( $arr ) ? implode('|', $arr) : $arr;
		
		$regex = '/(<p>)?(<(' . $string_arr . ')([^>]+)?>(.*?)(<\/(' . $string_arr . ')>)?)<\/p>/ms';

		$newstring = preg_replace('/\n|\r|\r\n/m', '</p><p>', $newstring);
		$newstring = preg_replace('/<p><\/p>/ms', '', $newstring );
		$newstring = preg_replace($regex, '$2', $newstring);
		$newstring = str_replace('<p></p>', '', $newstring);
		$newstring = preg_replace('/<\/p><p>$/ms', '', $newstring); 

		// add p if content has p
		preg_match_all('/<(blockquote[^>]*|div style[^>]* class="jbbed-spoiler")>(.*?)<\/(blockquote|div)>/', $newstring, $match );
		foreach( $match[2] as $m ) {
			if( stripos( $m, '<p>' ) !== false ) {
				$nm = '<p>' . $m;
				$newstring = str_replace( $m, $nm, $newstring );
			}
		}

		/**
		 * Unlike the JS processor, this parse closes on the first available tag. 
		 * So in the case of "<strong>Hello <strong>World</strong>, Hi!</strong>", 
		 * this will become: "<strong>Hello World</strong>, Hi!"
		 */
		$noTagIntoTag = $this->args['noTagIntoTag'];
		$string_arr = is_array( $noTagIntoTag ) ? implode('|', $noTagIntoTag) : $noTagIntoTag;
		preg_match_all('/<((' . $string_arr . ')([^>]*))>(.*?)<\/(' . $string_arr . ')>/', $newstring, $match );
		foreach( $match[0] as $key => $m ) {
			$open = '<' . $match[1][$key] . '>';
			$close = '</' . $match[2][$key] . '>';
			$nm = $open . strip_tags( $m ) . $close;
			$newstring = str_replace( $m, $nm, $newstring );
		}
	
		// decode all content into code tags
		preg_match_all('/<pre[^>]*>(.*?)<\/pre>/ms', $newstring, $matches );
		$content_code = $matches[1];
		$decode = [];
		foreach( $content_code as $content ) {
			$content = preg_replace('/(\n)(.*?)(\n)/', '<li><code>$2</code><li>', base64_decode( $content ) );
			$decode[] = '<ol><li><code>' . $content . '</code></li></ol>';
		}
		$newstring = str_replace( $content_code, $decode, $newstring );
	
	    return '<p>' . $newstring . '</p>';
    }
	
    /**
     * Convert bbtags to html
     * @return string
     */
	public function convert() {
		$this->_remove();
		$this->_clearString();
		
		$tags = explode( '|', $this->args['tags']);
		$string = $this->string;
		$tagTranslate = $this->args['tagTranslate'];
		
		foreach( $tags as $tag ) {
			
			if( isset( $tagTranslate[$tag] ) && 
				in_array( $tag, array_keys( $tagTranslate ) ) || 
				$tag === 'vid' || $tag === 'jsf' )
			{

				// simple translate (no attrs, but the html tag is different from the bbcode tag)
	  			if( strlen( $tagTranslate[$tag][1] ) === 0 ) {
					$string = str_replace(
						['[' . $tag . ']', '[/' . $tag . ']'],
						['<' . $tagTranslate[$tag][0] . '>', '</' . $tagTranslate[$tag][0] . '>'],
						$string
					);
				}

				 // static translate (attrs does not require value substitution)
	  			if( strlen( $tagTranslate[$tag][1] ) > 0 && stripos('$1', $tagTranslate[$tag][1] ) === false ) {

					$open = $tagTranslate[$tag][0] . ' ' . $tagTranslate[$tag][1];
					$close = $tagTranslate[$tag][0];
					$beforeOpen = '';
					$afterClose = '';
					if( $tag === 'spoiler' ) {
						$beforeOpen = '<div class="jbbed-spoiler-container">';
						$afterClose = '<button type="button" class="jbbed-spoiler-button">Spoiler</button></div>';
					}

					$string = str_replace(
						['[' . $tag . ']', '[/' . $tag . ']'],
						[ $beforeOpen . '<' . $open . '>', '</' . $close . '>' . $afterClose],
						$string
					);
				}

				// dynamic translate (attrs require value substitution)
				$regex = isset( $tagTranslate[$tag][2] ) && strlen( trim( $tagTranslate[$tag][2] ) ) > 0 ?
					$tagTranslate[$tag][2] : '.*?';

				$regex_bbcode = '/\[' . $tag . '=(' . $regex . ')\]/';
				preg_match_all( $regex_bbcode, $string, $match );

				$alias = false;

				foreach( $match[0] as $k => $m ) {
					
					$close = '[/' . $tag . ']';
					if( $tag === 'vid' ) {
						
						$bbcode = $match[0][$k];
						$url = $match[1][$k];
				
						$iframe = $this->_getVideo( $url, $bbcode );
						$string = str_replace( $bbcode, $iframe, $string );
						
					}
					elseif( $tag === 'jsf') {
						$bbcode = $match[0][$k];
						$url = $match[1][$k];
						$jsf = $this->_jsf( $url );
						$string = str_replace( $bbcode, $jsf, $string );
					}
					else {
						$open = $alias === true ? '[' . $tag . ']' : $match[0][$k];
						$value = $alias === true ? '' : (isset($match[1][$k]) ? $match[1][$k] : '');
						$html = $this->_getHtml($tagTranslate[$tag], $value, $tag );
						$string = str_replace( [$open, $close], $html, $string );
					}
				
				}// end foreach match
			
			} else {
				if( $tag === 'h') {
					$string = preg_replace( '/\[(\/?' . $tag . '[0-6])\]/', '<$1>', $string );
				} else {
					$bbtag = ['[' . $tag . ']','[/' . $tag . ']'];
					$html = ['<' . $tag . '>', '</' . $tag . '>'];
					$string = str_replace($bbtag, $html, $string);
				}
			}
			
		}
		
		// apply autop
		$string = $this->_autop($string);
		
		return $string;
		
	}

    /**
     * Generate unique id
     * @source: https://www.php.net/manual/en/function.uniqid.php#120123
	 * 
	 * @param int $length // chars to display for unique id
	 * @return string
     */
    static function uniqidReal($lenght = 13) {
        if (function_exists("random_bytes")) {
            $bytes = random_bytes(ceil($lenght / 2));
        } elseif (function_exists("openssl_random_pseudo_bytes")) {
            $bytes = openssl_random_pseudo_bytes(ceil($lenght / 2));
        } else {
            throw new Exception("no cryptographically secure random function available");
        }
        return substr(bin2hex($bytes), 0, $lenght);
    }
	
}

/**
 * Wrap to use convert class
 * 
 * @param string $string // string to convert
 * @param array $args // array of arguments to pass. See class
 * @param bool $replace // check if you want replace or not
 * @param string $remove // tags to remove
 * 
 * @return string
 */
function jbbed_convert( $string = '', $args = [], $replace = false, $remove = ''  ) {
    $inst = new jbbedDecode( $string, $args, $replace, $remove  );
    return $inst->convert();
}

/**
 * Implements spoiler. Add this function in the header or body
 * @param int|string $slide
 * @param string $buttonShow
 * @param string $buttonHide
 */
function jbbed_spoiler( $slide = 400, $buttonShow = 'Spoiler', $buttonHide = 'Hide') {
	?>
	<script>
		jQuery(function($) {
			const slide = '<?php echo abs(intval($slide)); ?>',
				  buttonShow = '<?php echo htmlspecialchars( $buttonShow ); ?>',
				  buttonHide = '<?php echo htmlspecialchars( $buttonHide ); ?>';

			$('.jbbed-spoiler').each(function() {
				// action show/hide
				$(this).next('button').on("click", function() {
					const btn = $(this);
					btn.prev().toggle(slide, function() {
						if( ! $(this).is(':hidden')) {
							btn.text(buttonShow);
						} else {
							btn.text(buttonHide)
						}
					});
				});
			});
		});
	</script>
	<?php
}