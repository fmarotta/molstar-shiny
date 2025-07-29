#' Create a Mol* Viewer for Shiny Applications
#'
#' This function generates the necessary HTML and JavaScript to embed a Mol* viewer in a Shiny application. It allows for the visualization of molecular structures using PDB content and supports custom coloring of regions.
#'
#' @param outputId A character string specifying the output ID for the Mol* viewer.
#' @param pdbContents A character string containing the PDB file contents to be visualized.
#' @param defaultColor A character string specifying the default color for the molecular structure in hexadecimal format (e.g., "#D3D3D3"). Default is "#D3D3D3".
#' @param regionColors A data frame or matrix with columns 'selector' and 'color', where 'selector' specifies the region to color and 'color' is the hexadecimal color code. Default is NULL, meaning no region-specific coloring.
#' @param width A character string specifying the width of the viewer. Default is "100%".
#' @param height A character string specifying the height of the viewer. Default is "400px".
#' @param fill A logical value indicating whether the viewer should fill the available space. Default is FALSE.
#'
#' @return A list of HTML elements and JavaScript code required to render the Mol* viewer in a Shiny application.
#'
#' @importFrom htmltools htmlDependency HTML css validateCssUnit bindFillRole tagList tags div
#' @importFrom utils packageVersion
#' @importFrom glue glue
#'
#' @examples
#' \dontrun{
#'   library(shiny)
#'   ui <- fluidPage(
#'     molstarOutput("molstar_viewer", pdbContents = "PDB CONTENT HERE")
#'   )
#'   server <- function(input, output, session) {}
#'   shinyApp(ui, server)
#' }
#'
#' @export
molstarOutput <- function(outputId, pdbContents = "", defaultColor = "#D3D3D3", regionColors = NULL, width = "100%", height = "400px", fill = FALSE) {
  style <- htmltools::css(
    position = "relative",
    width = htmltools::validateCssUnit(width),
    height = htmltools::validateCssUnit(height)
  )
  defaultColor <- glue::glue("0x{sub('#', '', defaultColor)}")
  regionColors <- if (!is.null(regionColors)) {
    paste(
      "[",
      apply(regionColors, 1, function(r) {
        glue::glue(.open = "<", .close = ">", "{selector: \"<r['selector']>\", color: 0x<toupper(sub('#', '', r['color']))>}")
      }) |> paste(collapse = ", "),
      "]"
    )
  } else {
    "null"
  }
  htmltools::tagList(
    htmltools::htmlDependency(
      name = "molstarShiny-asset",
      version = utils::packageVersion("molstarShiny"),
      package = "molstarShiny",
      src = "www",
      script = "index.js",
      stylesheet = "style.css"
    ),
    htmltools::bindFillRole(
      htmltools::div(id = outputId, style = style),
      item = fill
    ),
    tags$script(htmltools::HTML(glue::glue(.open = "<", .close = ">", "
        molstarShiny.initViewer(
          '<outputId>',
          `<pdbContents>`,
          <defaultColor>,
          <regionColors>,
        );
    ")))
  )
}
