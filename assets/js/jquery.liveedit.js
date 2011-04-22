(function(jQuery){ 


    var methods = {


		init: function( options ) {

            var settings = {
                'hidetextarea' : true
            }

			return this.each( function() {

				if ( this.type != 'textarea' ) {
					return false;
				}
                
                if ( options ) { 
                    jQuery.extend( settings, options );
                }




				var $textarea = jQuery(this);
				var $editarea = jQuery('<div/>').addClass('editable_content').html( $textarea.val() );
			
                jQuery(this).data('liveedit', {
                    target: $textarea,
                    editarea: $editarea,
                    bindElement: bindElement,
                    updateTextArea: updateTextArea,
                    exitEditMode: exitEditMode
                });


                var closeEditFunc;
                var isDragging = false;
                var overChild = false;
                var editingChild = false;


				if ( settings['hidetextarea'] ) {
                    $textarea.css('display', 'none');
				}
                $editarea.insertAfter( $textarea );

				initialize();



                function bindElement( elem ) {
						var tagname = elem.get(0).tagName;
						switch( tagname ) {
							case 'P':
								bindTextTag( elem );
                                elem.children('IMG').each( function() {
                                    bindImgTag( this );
                                });
                                elem.children('A').each( function() {
                                    bindATag( this );
                                });
                                break;
                            case 'H1': case 'H2': case 'H3': case 'H4':
                                bindTextTag( elem );
                                break;
                            case 'IMG':
                                bindImgTag( elem );
                                break;
                            case 'A':
                                bindATag( elem );
                                break;
                            case 'DIV':
                                //bindDivTag( elem );
                                break;
                            default:
                                break;
                        }

                }

				function initialize() {

					$editarea.children().each( function() {
                        var $this = jQuery(this);
                        bindElement( $this );
                    });			



                    var checkescape = function(e) { if (e.keyCode == 27) { return exitEditMode(); } };
                    $editarea.bind( 'keyup', checkescape );


                    $editarea.mousemove( function(event) {

                        var dragging = $editarea.children('.editor_dragging').first();

                        if (!( dragging && dragging.get(0)) ) {
                            return true;
                        }

                        if ( isDragging == false ) {
                            if ( closeEditFunc ) {
                                closeEditFunc();
                            }
                            isDragging = true;
                        }

                        var placeholder = $editarea.children('.editor_dragplaceholder').first();
                        if (!( placeholder && placeholder.get(0)) ) {
                            $(dragging).before( jQuery('<div class="editor_dragplaceholder" />'));

                            placeholder = $editarea.children('.editor_dragplaceholder').first();
                            placeholder.css({
                                'width': dragging.outerWidth() + 'px',
                                'height': dragging.outerHeight() + 'px' 
                            });
                        }


                        dragging.css({
                            'position': 'absolute',
                            'top': (event.pageY - $editarea.offset().top ) - 20 + 'px'
                        });


                        var positions = new Array();
                        $editarea.children().each( function() {
                            var $this = jQuery(this);
                            if ( $this.get(0) != dragging.get(0) && $this.get(0) != placeholder.get(0) ) {
                                positions[positions.length] = { 'obj': $this, 'pos': $this.offset().top, 'height': $this.height() };
                            }
                        });

                        if ( positions.length > 0 ) {
                            var destpos = 0;
                            for ( var key in positions ) {
                                var pos = positions[key];
                                if ( event.pageY <  ( pos['pos'] + ( pos['height'] / 2 ) ) ) {
                                    break;
                                }
                                destpos++;
                            }
                            if ( destpos >= positions.length ) {
                                positions[positions.length-1]['obj'].after( placeholder );
                            } else {
                                positions[destpos]['obj'].before( placeholder );
                            }
                        }

                        return false;

                    });




                    $editarea.mouseup( function() {

                        var dragging = $editarea.children('.editor_dragging').first();

                        if (!( dragging && dragging.get(0)) ) {
                            return true;
                        }

                        dragging.removeClass('editor_dragging');
                        dragging.css({
                            'top':'',
                            'position':''
                        });
                        $editarea.children('.editor_dragplaceholder').after( dragging );
                        $editarea.children('.editor_dragplaceholder').remove();

                        if ( isDragging ) {
                            updateTextArea();
                        }
                        isDragging=false;


                        return false;
                    }); 


				} //end initialize




                function bindTextTag( elem ) {

                    elem.hover(
                        function() { jQuery(this).addClass( 'edit_hover' ); },
                        function() { jQuery(this).removeClass( 'edit_hover' ); }
                    );

                    var csscopy = [
                        'paddingTop',
                        'paddingRight',
                        'paddingBottom',
                        'paddingLeft',
                        'fontSize',
                        'lineHeight',
                        'fontFamily',
                        'fontWeight',
                        'borderLeft',
                        'borderRight',
                        'borderTop',
                        'borderBottom',
                        'marginTop',
                        'marginLeft',
                        'marginRight',
                        'marginBottom'];

                    elem.mousedown( function() {
                        if ( editingChild || isDragging ) {
                            return true;
                        }

                        jQuery(this).addClass('editor_dragging');
                        return false;
                    });

                    elem.click( function() {
                        var $this = jQuery(this);

                        if ( overChild || editingChild || isDragging ) {
                            return; //let's ignore the click if they were doing something else at the time.
                        }

                        if ( closeEditFunc ) {
                            closeEditFunc();
                        }
        
                        var editorhtml = '<div class="editor_active"><textarea class="txt_editing"></textarea></div>';
                        var editor = $this.after( editorhtml );
                        $editarea.find(".txt_editing").val( replaceBreaks( $this.html()) ).focus();
                        $editarea.find(".txt_editing").css({
                            'width': "100%",
                            'height': "auto"
                        });
                        $editarea.find(".editor_active").css('min-height', $this.height() + 'px' );
                        $editarea.find(".txt_editing_done").click( function() { return editCompleteTextTag( $this ); });
                        $editarea.find(".txt_editing_cancel").click( function() { return cancelEditing( ); });
                        for ( x=0; x< csscopy.length; x++ ) {
                            $editarea.find(".txt_editing").css( csscopy[x].toString(), $this.css( csscopy[x].toString() ) );
                        }
                        $editarea.find(".txt_editing")
                            .bind( 'focus', resizeTextarea )
                            .bind( 'keyup', resizeTextarea )
                            .bind( 'change', resizeTextarea )
                            .each( function() { resizeTextarea( this ); } );
                        
                        closeEditFunc = function(){ return editCompleteTextTag( $this ); };
                        $this.addClass('currently_editing');
                    });


                }


                //
                //Adjust the height of a textarea to fit contents.
                //Adapted from:
                //http://blogs.sitepoint.com/build-auto-expanding-textarea-3/
                //
                function resizeTextarea(e) {  
                    var hCheck = !(jQuery.browser.msie || jQuery.browser.opera);

                    // event or element?  
                    e = e.target || e; 
                    // find content length and box width  
                    var vlen = e.value.length, ewidth = e.offsetWidth;  
                    if (vlen != e.valLength || ewidth != e.boxWidth) {  
                        if (hCheck && (vlen < e.valLength || ewidth != e.boxWidth)) e.style.height = "0px";  
                        var h = e.scrollHeight;  
                        e.style.overflow = (e.scrollHeight > h ? "auto" : "hidden");  
                        e.style.height = h + "px";  
                        e.valLength = vlen;  
                        e.boxWidth = ewidth;  
                    }  
                    return true;  
                }  

 
                function editCompleteTextTag( elem ) {
                    $editarea.find('.currently_editing').unbind().children('IMG').each( function() {
                        jQuery(this).unbind();
                    });

                    var newtxt = $editarea.find('.txt_editing').val();
                    var tagname = $editarea.find('.currently_editing').get(0).tagName;

                    var paragraphs = newtxt.split(/\n\n/g);
                    for ( var x=paragraphs.length-1 ; x>=0; x-- ) {
                        paragraph = paragraphs[x];
                        if ( paragraph == "" )
                            continue;


                        if ( paragraph.match(/^s.*$/) ) {
                            paragraph = "&nbsp;";
                        }
                        paragraph = formatBreaks( paragraph );
                        var newp = jQuery('<' + tagname + '>' + paragraph + '</' + tagname + '>');
                        $editarea.find('.currently_editing').after( newp );
                        bindTextTag( newp );
                        newp.children('IMG').each( function() {
                                bindImgTag( this );
                        });
                        newp.children('A').each( function() {
                                bindATag( this );
                        });
                    }


                    $editarea.find('.editor_active').remove();
                    $editarea.find('.currently_editing').remove();

                    closeEditFunc=null;
                    updateTextArea();
                    return false;
                }
                function cancelEditing() {
                    $editarea.find('.currently_editing').removeClass('currently_editing');
                    $editarea.find('.editor_active').remove();
                    closeEditFunc=null;
                    overChild = false;
                    editingChild = false;
                    updateTextArea();
                    return false;
                }
                function deleteEditing() {
                    $editarea.find('.editor_active').remove();
                    $editarea.find('.currently_editing').unbind().remove();
                    closeEditFunc=null;
                    overChild = false;
                    editingChild = false;
                    updateTextArea();
                    return false;
                }
                function exitEditMode() {
                    if ( closeEditFunc != null ) {
                        closeEditFunc();
                        updateTextArea();
                    }
                    return false;
                }
                function formatBreaks( htmltext ) {
                    return htmltext.replace(/(\n)/ig, "<br />");
                }
                function replaceBreaks( htmltext ) {
                    return htmltext.replace(/(<br\s*\/?>)/ig, "\n");
                }



                function bindImgTag( elem ) {


                    //hack... need a way to know if the user is clicking on an image inside a p, or just the p itself.
                    jQuery(elem).hover(
                            function() {
                                jQuery(this).addClass( 'edit_hover' );
                                if ( !jQuery(this).parent().hasClass( 'editable_content' ) ) {
                                    overChild = true;
                                }
                            },
                            function() {
                                jQuery(this).removeClass( 'edit_hover' );
                                if ( !jQuery(this).parent().hasClass( 'editable_content' ) ) {
                                    overChild = false;
                                }
                            }
                    );


                    jQuery(elem).mousedown( function() {
                        var $this = jQuery(this);
                        if ( !$this.parent().hasClass( 'editable_content' ) || isDragging ) {
                            return true;
                        }

                        $this.addClass('editor_dragging');
                        return false;
                    });


                    jQuery(elem).click( function() {

                            var $this = jQuery(this);
                            if ( isDragging ) {
                                return;
                            }

                            if ( closeEditFunc ) {
                                closeEditFunc();
                            }
                            if ( !$this.parent().hasClass( 'editable_content' ) ) {
                                editingChild = true;
                            }

                            var editorhtml = '<div class="editor_active" ><img class="img_preview_editing" /><div class="img_edit_box"><a href="" class="editing_done">Done</a> <a href="" class="editing_cancel">Cancel</a> <a href="" class="editing_delete">Delete</a><br />Src: <input class="img_src_editing"><br />Width: <input class="img_width_editing"> Height: <input class="img_height_editing"></div></div>';
                            var $editor = jQuery( editorhtml );
                            $this.after( $editor );

                            $editor.find(".img_src_editing").val( $this.attr('src') );
                            $editor.find(".img_width_editing").val( $this.attr('width') );
                            $editor.find(".img_height_editing").val( $this.attr('height') );
                            $editor.find(".editing_done").click( function() { return editCompleteImgTag( $this ); });
                            $editor.find(".editing_cancel").click( function() { return cancelEditing( ); });
                            $editor.find(".editing_delete").click( function() { return deleteEditing( ); });
                            closeEditFunc = function(){ return cancelEditing(); };
                            $this.addClass('currently_editing');

                            var adjpreview = function() {

                                var w = $editor.find(".img_width_editing").val();
                                var h = $editor.find(".img_height_editing").val();
                                if ( w == "" ) w = null;
                                if ( h == "" ) h = null;
                                

                                $editor.find(".img_preview_editing").attr( 'src', $editor.find(".img_src_editing").val() );
                                $editor.find(".img_preview_editing").attr( 'width', w );
                                $editor.find(".img_preview_editing").attr( 'height', h );

                                var h = $editarea.find('.currently_editing').height();
                                if ( $editor.find(".img_preview_editing").height() > h ) {
                                    h = $editor.find(".img_preview_editing").height();
                                }
                                $editarea.find(".editor_active")
                                    .css('min-height', h + 'px' )
                                    .css('min-width', $editor.find(".img_preview_editing").width() + 'px' );
                            }

                            adjpreview();

                            $editor.find(".img_src_editing").change( adjpreview );
                            $editor.find(".img_width_editing").change( adjpreview );
                            $editor.find(".img_height_editing").change( adjpreview );

                            setTimeout( function() { overChild = false; }, 100 );
                    });



                
                }



                
                function editCompleteImgTag( elem ) {
                    var w = $editarea.find(".img_width_editing").val();
                    var h = $editarea.find(".img_height_editing").val();
                    if ( w == "" ) w = null;
                    if ( h == "" ) h = null;
                    
                   

                    var newimage = jQuery('<img />')
                        .attr('src', $editarea.find('.img_src_editing').val())
                        .attr('width', w)
                        .attr('height', h);
                    $editarea.find('.currently_editing').after( newimage );


                    if ( !newimage.get(0).complete || (typeof newimage.get(0).naturalWidth != "undefined" && newimage.get(0).naturalWidth == 0 ) || newimage.get(0).readyState == 'uninitialized' || newimage.width() == 0 || newimage.height() == 0 ) {
                        newimage.addClass('problem_image');
                    }
                    bindImgTag( newimage );
                    
                    $editarea.find('.currently_editing').unbind().remove();
                    $editarea.find('.editor_active').remove();
                    closeEditFunc=null;
                    editingChild = false;
                    updateTextArea();
                    return false;
                }




                function bindATag( elem ) {


                    //hack... need a way to know if the user is clicking on an image inside a p, or just the p itself.
                    jQuery(elem).hover(
                            function() { 
                                jQuery(this).addClass( 'edit_hover' );
                                if ( !jQuery(this).parent().hasClass( 'editable_content' ) ) {
                                    overChild = true;
                                }
                            },
                            function() {
                                jQuery(this).removeClass( 'edit_hover' );
                                if ( !jQuery(this).parent().hasClass( 'editable_content' ) ) {
                                    overChild = false;
                                }
                            }
                    );


                    jQuery(elem).mousedown( function() {
                        var $this = jQuery(this);
                        if ( !$this.parent().hasClass( 'editable_content' ) || isDragging ) {
                            return true;
                        }

                        $this.addClass('editor_dragging');
                        return false;
                    });


                    jQuery(elem).click( function() {

                            var $this = jQuery(this);
                            if ( isDragging ) {
                                return false;
                            }

                            if ( closeEditFunc ) {
                                closeEditFunc();
                            }
                            if ( !$this.parent().hasClass( 'editable_content' ) ) {
                                editingChild = true;
                            }

                            var editorhtml = '<div class="editor_active" ><div class="a_edit_box"><a href="" class="editing_done">Done</a> <a href="" class="editing_cancel">Cancel</a> <a href="" class="editing_delete">Delete</a><br />URL: <input class="a_url_editing"><br />Anchor Text: <input class="a_text_editing">';
                            var $editor = jQuery( editorhtml );
                            $this.after( $editor );

                            $editor.find(".a_url_editing").val( $this.attr('href') );
                            $editor.find(".a_text_editing").val( $this.html() );
                            $editor.find(".editing_done").click( function() { return editCompleteATag( $this ); });
                            $editor.find(".editing_cancel").click( function() { return cancelEditing( ); });
                            $editor.find(".editing_delete").click( function() { return deleteEditing( ); });
                            closeEditFunc = function(){ return editCompleteATag( $this ); };
                            $this.addClass('currently_editing');


                            setTimeout( function() { overChild = false; }, 100 );
                            return false;
                    });



                
                }


                function editCompleteATag( elem ) {
                   
                    var newa = jQuery('<a />')
                        .attr('href', $editarea.find('.a_url_editing').val())
                        .html( $editarea.find('.a_text_editing').val() );
                    $editarea.find('.currently_editing').after( newa );


                    bindATag( newa );
                    
                    $editarea.find('.currently_editing').unbind().remove();
                    $editarea.find('.editor_active').remove();
                    closeEditFunc=null;
                    editingChild = false;
                    updateTextArea();
                    return false;
                }




           
                function updateTextArea() {
                     var $newhtml = jQuery('<div />');
                     $newhtml.html( $editarea.html() );
                     $newhtml.find('.edit_hover').removeClass('edit_hover');
                     $newhtml.find('.editor_dragging').removeClass('editor_dragging');
                     $newhtml.find('*[class=""]').removeAttr('class');
                     $newhtml.find('*[style=""]').removeAttr('style');
                     $textarea.val( $newhtml.html() );
                }


			}); //end each returned liveeditor



		},  //end liveedit init


        addtools: function( options ) {

            var settings = {
                'target': null,
                'plipsum': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed posuere, justo egestas fermentum viverra, dolor lorem imperdiet diam, vel auctor diam tellus vitae nulla. Aenean ut quam vitae odio bibendum adipiscing. Aenean ut purus enim, in lacinia nisl.',
                'hlipsum': 'Lorem ipsum dolor sit amet',
                'imglipsum': '<img src="assets/images/test.jpg" width="350" />',
                'alipsum': '<a href="#">Lorem ipsum dolor sit amet</a> ',
                'enable': ['p','h1','h2','h3','img','a']
            };

            return this.each( function() {

                if ( this.type != 'textarea' ) {
                    return false;
                }

                if ( options ) {
                    jQuery.extend( settings, options );
                }


                var $textarea = jQuery(this);
                var $tools = jQuery( settings['target'] );
                var data = $textarea.data('liveedit');
                var $editarea = data['editarea'];
                data['tools'] = $tools;
                $textarea.data('liveedit', data );


                for ( var key in settings['enable'] ) {
                    switch( settings['enable'][key] ) {
                        case 'p':
                            $tools.append( generateTextTool( $textarea, 'p', 'P', settings['plipsum'] ) ).append('&nbsp;');
                            break;
                        case 'h1':
                            $tools.append( generateTextTool( $textarea, 'h1', 'H1', settings['hlipsum'] ) ).append('&nbsp;');
                            break;
                        case 'h2':
                            $tools.append( generateTextTool( $textarea, 'h2', 'H2', settings['hlipsum'] ) ).append('&nbsp;');
                            break;
                        case 'h3':
                            $tools.append( generateTextTool( $textarea, 'h3', 'H3', settings['hlipsum'] ) ).append('&nbsp;');
                            break;
                        case 'img':
                            $tools.append( generateRawTool( $textarea, 'img', 'IMG', settings['imglipsum'] ) ).append('&nbsp;');
                            break;
                        case 'a':
                            $tools.append( generateRawTool( $textarea, 'a', 'A', settings['alipsum'] ) ).append('&nbsp;');
                            break;
                    }
                }



            }); //end each returned liveedittools

            function generateTextTool( target, tag, text, lipsum ) {
                var tool = jQuery('<a class="liveedit_tools_add_' + tag  + '" href="">' + text + '</a>');
                tool.mousedown( function(event) {
                        var newtag = jQuery('<' + tag + '/>').text( lipsum ).addClass('editor_dragging');
                        target.liveedit('addcontent', { 'content': newtag } );
                        return false;
                    });
                tool.click( function(event) {
                        var $editarea = target.data('liveedit')['editarea'];
                        $editarea.find('.editor_dragging').removeClass('editor_dragging');
                        return false;
                    });

                return tool;
            
            }
            function generateRawTool( target, tag, text, toolhtml ) {
                var tool = jQuery('<a class="liveedit_tools_add_' + tag  + '" href="">' + text + '</a>');
                tool.mousedown( function(event) {
                        var newtag = jQuery(toolhtml).addClass('editor_dragging');
                        target.liveedit('addcontent', { 'content': newtag } );
                        return false;
                    });
                tool.click( function(event) {
                        var $editarea = target.data('liveedit')['editarea'];
                        $editarea.find('.editor_dragging').removeClass('editor_dragging');
                        return false;
                    });

                return tool;
            
            }

        }, //end addtools

        addcontent: function( options ) {
            var settings = {
                'content': null
            };

            return this.each( function() {
            
                if ( this.type != 'textarea' ) {
                    return false;
                }

                if ( options ) {
                    jQuery.extend( settings, options );
                }

                var $textarea = jQuery(this);
                var data = $textarea.data('liveedit');
                var $target = data['target'];
                var $editarea = data['editarea'];
                

                var $newcontent = jQuery(settings['content']);
                var openEditor = $editarea.find('.txt_editing');
                if ( ($newcontent.get(0).tagName == 'IMG' || $newcontent.get(0).tagName == 'A' ) && openEditor.get(0) != null ) {
                    
                    var caretpos = getSelection( openEditor ).start;
                    var val = openEditor.val();
                    
                    openEditor.val( val.substr( 0, caretpos ) + $newcontent.removeClass('editor_dragging').clone().wrap('<div />').parent().html() + val.substr( caretpos, val.length ) );
                    var exitEditMode = data['exitEditMode'];
                    exitEditMode();

                } else {
                    $editarea.prepend( $newcontent );
                    var bindElement = data['bindElement'];
                    bindElement( $newcontent );
                    var updateTextArea = data['updateTextArea'];
                    updateTextArea( );
                }


            });


            // 
            // Not fully tested in IE. Derived from:
            // http://stackoverflow.com/questions/263743/how-to-get-cursor-position-in-textarea
            //
            function getSelection( elem ) {

                var result = { start: 0, end: 0 };
                var field = elem.jquery ? elem.get(0) : elem;

                if ( field.selectionStart ) {
                    result['start'] = field.selectionStart;
                    result['end'] = field.selectionEnd;
                } else if ( field.selection ) {

                    field.focus(); 

                    var r = document.selection.createRange(); 
                    if (r != null) { 

                        var re = field.createTextRange(); 
                        var rc = re.duplicate(); 
                        re.moveToBookmark(r.getBookmark()); 
                        rc.setEndPoint('EndToStart', re); 

                        result['start'] = rc.text.length;
                        result['end'] = rc.text.length + r.text.length;
                    }
                }

                return result;


            }

        } //end addcontent

    }; //end liveedit methods

    jQuery.fn.liveedit = function( method ) {

        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.liveedit' );
        }    

    };


})(jQuery);
