import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
    InspectorControls,
    BlockControls,
    useBlockProps,
} from '@wordpress/block-editor';
import {
    PanelBody,
    RangeControl,
    TextControl,
    ToolbarGroup,
    ToolbarButton,
    BaseControl,
    Notice,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { fabric } from 'fabric';
import './editor.css';

const TOOLS = {
    PEN:    'pen',
    SELECT: 'select',
    ERASER: 'eraser',
};

registerBlockType( 'modular-blocks/svg-drawing', {
    edit: function Edit( { attributes, setAttributes } ) {
        const {
            svgContent,
            fabricJSON,
            canvasWidth,
            canvasHeight,
            strokeColor,
            strokeWidth,
            backgroundColor,
            altText,
        } = attributes;

        const canvasRef       = useRef( null );
        const fabricRef       = useRef( null );
        const historyRef      = useRef( [] );
        const historyIndexRef = useRef( -1 );
        const activeToolRef   = useRef( TOOLS.PEN );  // mutable ref avoids stale closures in event handlers
        const isErasingRef    = useRef( false );

        const [ activeTool, setActiveTool ] = useState( TOOLS.PEN );
        const [ pasteStatus, setPasteStatus ] = useState( '' );

        // Keep ref and state in sync
        const switchTool = ( tool ) => {
            activeToolRef.current = tool;
            setActiveTool( tool );
        };

        // Initialize fabric canvas once on mount
        useEffect( () => {
            if ( ! canvasRef.current || fabricRef.current ) return;

            const canvas = new fabric.Canvas( canvasRef.current, {
                width: canvasWidth,
                height: canvasHeight,
                backgroundColor: backgroundColor,
                isDrawingMode: true,
            } );

            canvas.freeDrawingBrush.color = strokeColor;
            canvas.freeDrawingBrush.width = strokeWidth;
            fabricRef.current             = canvas;

            // Restore saved state
            if ( fabricJSON ) {
                canvas.loadFromJSON( fabricJSON, () => {
                    canvas.renderAll();
                    const state = JSON.stringify( canvas.toJSON() );
                    historyRef.current      = [ state ];
                    historyIndexRef.current = 0;
                } );
            } else {
                const state = JSON.stringify( canvas.toJSON() );
                historyRef.current      = [ state ];
                historyIndexRef.current = 0;
            }

            // Save to attributes and history on canvas changes
            const handleChange = () => {
                const json = JSON.stringify( canvas.toJSON() );
                const svg  = canvas.toSVG();
                setAttributes( { fabricJSON: json, svgContent: svg } );
                historyRef.current = historyRef.current.slice( 0, historyIndexRef.current + 1 );
                historyRef.current.push( json );
                historyIndexRef.current = historyRef.current.length - 1;
            };

            canvas.on( 'object:added',    handleChange );
            canvas.on( 'object:modified', handleChange );
            canvas.on( 'object:removed',  handleChange );

            // Eraser: on mouse-down, mark as erasing and delete path under cursor
            canvas.on( 'mouse:down', ( e ) => {
                if ( activeToolRef.current !== TOOLS.ERASER ) return;
                isErasingRef.current = true;
                eraseAtPointer( canvas, canvas.getPointer( e.e ) );
            } );

            canvas.on( 'mouse:up', () => {
                isErasingRef.current = false;
            } );

            // Eraser: while dragging, continuously erase paths under cursor
            canvas.on( 'mouse:move', ( e ) => {
                if ( ! isErasingRef.current || activeToolRef.current !== TOOLS.ERASER ) return;
                eraseAtPointer( canvas, canvas.getPointer( e.e ) );
            } );

            return () => {
                canvas.dispose();
                fabricRef.current = null;
            };
        }, [] ); // eslint-disable-line react-hooks/exhaustive-deps

        // Erase helper: removes path objects whose bounding rect overlaps the pointer
        function eraseAtPointer( canvas, pointer ) {
            const pad   = 8; // hit padding in pixels for thin strokes
            const paths = canvas.getObjects( 'path' );
            for ( let i = paths.length - 1; i >= 0; i-- ) {
                const b = paths[ i ].getBoundingRect();
                if (
                    pointer.x >= b.left   - pad &&
                    pointer.x <= b.left   + b.width  + pad &&
                    pointer.y >= b.top    - pad &&
                    pointer.y <= b.top    + b.height + pad
                ) {
                    canvas.remove( paths[ i ] );
                    canvas.renderAll();
                    break; // Remove one path per frame for smooth erasing
                }
            }
        }

        // Update canvas when active tool changes
        useEffect( () => {
            const canvas = fabricRef.current;
            if ( ! canvas ) return;

            canvas.isDrawingMode = activeTool === TOOLS.PEN;
            canvas.selection     = activeTool === TOOLS.SELECT;

            canvas.forEachObject( ( obj ) => {
                obj.selectable = activeTool === TOOLS.SELECT;
            } );

            if ( activeTool === TOOLS.ERASER ) {
                canvas.upperCanvasEl.style.cursor = 'cell';
                canvas.defaultCursor              = 'cell';
                canvas.hoverCursor                = 'cell';
            } else if ( activeTool === TOOLS.PEN ) {
                canvas.upperCanvasEl.style.cursor = 'crosshair';
                canvas.defaultCursor              = 'crosshair';
                canvas.hoverCursor                = 'crosshair';
            } else {
                canvas.upperCanvasEl.style.cursor = 'default';
                canvas.defaultCursor              = 'default';
                canvas.hoverCursor                = 'move';
            }
            canvas.renderAll();
        }, [ activeTool ] );

        // Update brush when stroke settings change
        useEffect( () => {
            const canvas = fabricRef.current;
            if ( ! canvas ) return;
            canvas.freeDrawingBrush.color = strokeColor;
            canvas.freeDrawingBrush.width = strokeWidth;
        }, [ strokeColor, strokeWidth ] );

        // Resize canvas
        useEffect( () => {
            const canvas = fabricRef.current;
            if ( ! canvas ) return;
            canvas.setWidth( canvasWidth );
            canvas.setHeight( canvasHeight );
            canvas.renderAll();
        }, [ canvasWidth, canvasHeight ] );

        // Update background color
        useEffect( () => {
            const canvas = fabricRef.current;
            if ( ! canvas ) return;
            canvas.backgroundColor = backgroundColor;
            canvas.renderAll();
            setAttributes( { svgContent: canvas.toSVG() } );
        }, [ backgroundColor ] ); // eslint-disable-line react-hooks/exhaustive-deps

        const handleUndo = () => {
            const canvas = fabricRef.current;
            if ( ! canvas || historyIndexRef.current <= 0 ) return;
            historyIndexRef.current--;
            const json = historyRef.current[ historyIndexRef.current ];
            canvas.loadFromJSON( json, () => {
                canvas.renderAll();
                setAttributes( { fabricJSON: json, svgContent: canvas.toSVG() } );
            } );
        };

        const handleClear = () => {
            if ( ! fabricRef.current ) return;
            // eslint-disable-next-line no-alert
            if ( ! window.confirm( __( 'Gesamte Zeichnung löschen?', 'modular-blocks-plugin' ) ) ) return;
            const canvas = fabricRef.current;
            canvas.clear();
            canvas.backgroundColor = backgroundColor;
            canvas.renderAll();
            const json = JSON.stringify( canvas.toJSON() );
            const svg  = canvas.toSVG();
            setAttributes( { fabricJSON: json, svgContent: svg } );
            historyRef.current      = [ json ];
            historyIndexRef.current = 0;
        };

        const handleDeleteSelected = () => {
            const canvas = fabricRef.current;
            if ( ! canvas ) return;
            const active = canvas.getActiveObjects();
            if ( active.length ) {
                active.forEach( ( obj ) => canvas.remove( obj ) );
                canvas.discardActiveObject();
                canvas.renderAll();
            }
        };

        const addText = () => {
            const canvas = fabricRef.current;
            if ( ! canvas ) return;
            const text = new fabric.IText( __( 'Text', 'modular-blocks-plugin' ), {
                left: 60, top: 60,
                fontSize: 20,
                fill: strokeColor,
                fontFamily: 'Arial, sans-serif',
            } );
            canvas.add( text );
            canvas.setActiveObject( text );
            canvas.renderAll();
            switchTool( TOOLS.SELECT );
        };

        const addRect = () => {
            const canvas = fabricRef.current;
            if ( ! canvas ) return;
            const rect = new fabric.Rect( {
                left: 60, top: 60,
                width: 120, height: 80,
                fill: 'transparent',
                stroke: strokeColor,
                strokeWidth: strokeWidth,
            } );
            canvas.add( rect );
            canvas.setActiveObject( rect );
            canvas.renderAll();
            switchTool( TOOLS.SELECT );
        };

        const addCircle = () => {
            const canvas = fabricRef.current;
            if ( ! canvas ) return;
            const circle = new fabric.Circle( {
                left: 60, top: 60,
                radius: 50,
                fill: 'transparent',
                stroke: strokeColor,
                strokeWidth: strokeWidth,
            } );
            canvas.add( circle );
            canvas.setActiveObject( circle );
            canvas.renderAll();
            switchTool( TOOLS.SELECT );
        };

        // Convert Blob to base64 data URL and add to canvas
        const addImageFromBlob = ( blob ) => {
            const reader = new FileReader();
            reader.onload = ( ev ) => {
                const dataUrl = ev.target.result;
                const canvas  = fabricRef.current;
                if ( ! canvas ) return;
                fabric.Image.fromURL( dataUrl, ( img ) => {
                    const scale = Math.min(
                        ( canvas.getWidth()  / img.width  ) * 0.92,
                        ( canvas.getHeight() / img.height ) * 0.92,
                        1
                    );
                    img.set( { scaleX: scale, scaleY: scale, left: 10, top: 10 } );
                    canvas.add( img );
                    canvas.setActiveObject( img );
                    canvas.renderAll();
                    switchTool( TOOLS.SELECT );
                    setPasteStatus( 'success' );
                    setTimeout( () => setPasteStatus( '' ), 2500 );
                } );
            };
            reader.readAsDataURL( blob );
        };

        // Paste via Clipboard API (toolbar button — explicit permission prompt)
        const pasteFromClipboard = async () => {
            setPasteStatus( '' );
            try {
                const items = await navigator.clipboard.read();
                let found = false;
                for ( const item of items ) {
                    for ( const type of item.types ) {
                        if ( type.startsWith( 'image/' ) ) {
                            addImageFromBlob( await item.getType( type ) );
                            found = true;
                            break;
                        }
                    }
                    if ( found ) break;
                }
                if ( ! found ) {
                    setPasteStatus( 'no-image' );
                    setTimeout( () => setPasteStatus( '' ), 3500 );
                }
            } catch {
                setPasteStatus( 'permission' );
                setTimeout( () => setPasteStatus( '' ), 4000 );
            }
        };

        // Paste via keyboard Ctrl+V while canvas wrapper is focused
        const handlePaste = ( e ) => {
            e.preventDefault();
            e.stopPropagation();
            const items = Array.from( e.clipboardData?.items || [] );
            for ( const item of items ) {
                if ( item.type.startsWith( 'image/' ) ) {
                    addImageFromBlob( item.getAsFile() );
                    return;
                }
            }
            setPasteStatus( 'no-image' );
            setTimeout( () => setPasteStatus( '' ), 3500 );
        };

        const blockProps = useBlockProps( { className: 'svg-drawing-block-editor' } );

        const pasteMessages = {
            success:    __( 'Bild eingefügt!', 'modular-blocks-plugin' ),
            'no-image': __( 'Kein Bild in der Zwischenablage. Bitte kopiere zuerst eine Zeichnung (z.B. in OneNote Strg+C).', 'modular-blocks-plugin' ),
            permission: __( 'Zugriff auf Zwischenablage verweigert. Klicke auf die Zeichenfläche und nutze Strg+V.', 'modular-blocks-plugin' ),
        };

        const toolHints = {
            [ TOOLS.PEN    ]: __( '✏ Stift – frei zeichnen | Strg+V = Bild einfügen', 'modular-blocks-plugin' ),
            [ TOOLS.SELECT ]: __( '↖ Auswahl – Objekte verschieben/skalieren | Entf = löschen', 'modular-blocks-plugin' ),
            [ TOOLS.ERASER ]: __( '◻ Radierer – über Striche ziehen um sie zu löschen', 'modular-blocks-plugin' ),
        };

        return (
            <>
                <InspectorControls>
                    <PanelBody title={ __( 'Stift', 'modular-blocks-plugin' ) } initialOpen={ true }>
                        <BaseControl label={ __( 'Strichfarbe', 'modular-blocks-plugin' ) } id="svg-stroke-color">
                            <div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
                                <input
                                    id="svg-stroke-color"
                                    type="color"
                                    value={ strokeColor }
                                    onChange={ ( e ) => setAttributes( { strokeColor: e.target.value } ) }
                                    style={ { width: '48px', height: '32px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '3px', padding: '2px' } }
                                />
                                <span style={ { fontFamily: 'monospace', fontSize: '12px' } }>{ strokeColor }</span>
                            </div>
                        </BaseControl>
                        <RangeControl
                            label={ __( 'Strichbreite', 'modular-blocks-plugin' ) }
                            value={ strokeWidth }
                            onChange={ ( value ) => setAttributes( { strokeWidth: value } ) }
                            min={ 1 } max={ 20 }
                        />
                    </PanelBody>
                    <PanelBody title={ __( 'Zeichenfläche', 'modular-blocks-plugin' ) } initialOpen={ false }>
                        <BaseControl label={ __( 'Hintergrundfarbe', 'modular-blocks-plugin' ) } id="svg-bg-color">
                            <input
                                id="svg-bg-color"
                                type="color"
                                value={ backgroundColor }
                                onChange={ ( e ) => setAttributes( { backgroundColor: e.target.value } ) }
                                style={ { width: '100%', height: '32px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '3px' } }
                            />
                        </BaseControl>
                        <RangeControl
                            label={ __( 'Breite (px)', 'modular-blocks-plugin' ) }
                            value={ canvasWidth }
                            onChange={ ( value ) => setAttributes( { canvasWidth: value } ) }
                            min={ 200 } max={ 1600 } step={ 10 }
                        />
                        <RangeControl
                            label={ __( 'Höhe (px)', 'modular-blocks-plugin' ) }
                            value={ canvasHeight }
                            onChange={ ( value ) => setAttributes( { canvasHeight: value } ) }
                            min={ 100 } max={ 1200 } step={ 10 }
                        />
                    </PanelBody>
                    <PanelBody title={ __( 'Barrierefreiheit', 'modular-blocks-plugin' ) } initialOpen={ false }>
                        <TextControl
                            label={ __( 'Alt-Text', 'modular-blocks-plugin' ) }
                            value={ altText }
                            onChange={ ( value ) => setAttributes( { altText: value } ) }
                            help={ __( 'Beschreibung der Zeichnung für Screenreader', 'modular-blocks-plugin' ) }
                        />
                    </PanelBody>
                </InspectorControls>

                <BlockControls>
                    <ToolbarGroup>
                        <ToolbarButton
                            icon="edit"
                            label={ __( 'Stift (Freihand zeichnen)', 'modular-blocks-plugin' ) }
                            isActive={ activeTool === TOOLS.PEN }
                            onClick={ () => switchTool( TOOLS.PEN ) }
                        />
                        <ToolbarButton
                            icon="arrow-left-alt2"
                            label={ __( 'Auswahl / Verschieben', 'modular-blocks-plugin' ) }
                            isActive={ activeTool === TOOLS.SELECT }
                            onClick={ () => switchTool( TOOLS.SELECT ) }
                        />
                        <ToolbarButton
                            icon="editor-removeformatting"
                            label={ __( 'Radierer (Striche löschen)', 'modular-blocks-plugin' ) }
                            isActive={ activeTool === TOOLS.ERASER }
                            onClick={ () => switchTool( TOOLS.ERASER ) }
                        />
                        <ToolbarButton
                            icon="editor-textcolor"
                            label={ __( 'Text einfügen', 'modular-blocks-plugin' ) }
                            onClick={ addText }
                        />
                        <ToolbarButton
                            icon="admin-page"
                            label={ __( 'Rechteck', 'modular-blocks-plugin' ) }
                            onClick={ addRect }
                        />
                        <ToolbarButton
                            icon="marker"
                            label={ __( 'Ellipse / Kreis', 'modular-blocks-plugin' ) }
                            onClick={ addCircle }
                        />
                    </ToolbarGroup>
                    <ToolbarGroup>
                        <ToolbarButton
                            icon="undo"
                            label={ __( 'Rückgängig', 'modular-blocks-plugin' ) }
                            onClick={ handleUndo }
                        />
                        <ToolbarButton
                            icon="remove"
                            label={ __( 'Auswahl löschen', 'modular-blocks-plugin' ) }
                            onClick={ handleDeleteSelected }
                        />
                        <ToolbarButton
                            icon="trash"
                            label={ __( 'Alles löschen', 'modular-blocks-plugin' ) }
                            onClick={ handleClear }
                        />
                        <ToolbarButton
                            icon="images-alt2"
                            label={ __( 'Aus Zwischenablage einfügen (z.B. OneNote)', 'modular-blocks-plugin' ) }
                            onClick={ pasteFromClipboard }
                        />
                    </ToolbarGroup>
                </BlockControls>

                <div { ...blockProps }>
                    { pasteStatus && (
                        <Notice
                            status={ pasteStatus === 'success' ? 'success' : 'warning' }
                            isDismissible={ false }
                            className="svg-drawing-notice"
                        >
                            { pasteMessages[ pasteStatus ] }
                        </Notice>
                    ) }
                    <div
                        className={ `svg-drawing-canvas-wrapper${ activeTool === TOOLS.ERASER ? ' is-eraser' : '' }` }
                        tabIndex={ 0 }
                        onPaste={ handlePaste }
                        aria-label={ __( 'Zeichenfläche', 'modular-blocks-plugin' ) }
                    >
                        <canvas ref={ canvasRef } />
                    </div>
                    <p className="svg-drawing-status-hint">{ toolHints[ activeTool ] }</p>
                    { ! svgContent && (
                        <div className="svg-drawing-empty-hint">
                            <p>{ __( 'Zeichenfläche leer', 'modular-blocks-plugin' ) }</p>
                            <p>{ __( '• Stift auswählen und zeichnen', 'modular-blocks-plugin' ) }</p>
                            <p>{ __( '• In OneNote: Zeichnung markieren → Strg+C, dann hier ↑ Einfügen-Button klicken', 'modular-blocks-plugin' ) }</p>
                        </div>
                    ) }
                </div>
            </>
        );
    },

    save: () => null,
} );
