import AppKit
import Foundation
import ImageIO
import PDFKit
import Vision

enum OcrFailure: Error {
    case invalidArguments
    case unreadableImage
    case unreadablePdf
    case pdfPageLimitExceeded
    case outputLimitExceeded
}

let maximumImageDimension = 2400
let maximumPdfPages = 200
let maximumOutputCharacters = 4_000_000

func recognize(_ cgImage: CGImage) throws -> [String] {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    if #available(macOS 13.0, *) {
        request.automaticallyDetectsLanguage = true
    }
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([request])
    return (request.results ?? []).compactMap { observation in
        observation.topCandidates(1).first?.string
    }
}

func recognizeImage(at url: URL) throws -> [String] {
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else {
        throw OcrFailure.unreadableImage
    }
    let options: [CFString: Any] = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceCreateThumbnailWithTransform: true,
        kCGImageSourceThumbnailMaxPixelSize: maximumImageDimension
    ]
    guard let cgImage = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else {
        throw OcrFailure.unreadableImage
    }
    return try recognize(cgImage)
}

func recognizePdf(at url: URL) throws -> [String] {
    guard let document = PDFDocument(url: url) else {
        throw OcrFailure.unreadablePdf
    }
    guard document.pageCount <= maximumPdfPages else {
        throw OcrFailure.pdfPageLimitExceeded
    }
    var lines: [String] = []
    var outputCharacters = 0
    for pageIndex in 0..<document.pageCount {
        guard let page = document.page(at: pageIndex) else { continue }
        let bounds = page.bounds(for: .mediaBox)
        let scale = min(
            4.0,
            CGFloat(maximumImageDimension) / max(max(bounds.width, bounds.height), 1.0)
        )
        let size = NSSize(width: bounds.width * scale, height: bounds.height * scale)
        let image = page.thumbnail(of: size, for: .mediaBox)
        guard
            let representation = image.tiffRepresentation,
            let bitmap = NSBitmapImageRep(data: representation),
            let cgImage = bitmap.cgImage
        else {
            continue
        }
        let pageLines = try recognize(cgImage)
        if !pageLines.isEmpty {
            outputCharacters += pageLines.reduce(0) { $0 + $1.count } + pageLines.count
            guard outputCharacters <= maximumOutputCharacters else {
                throw OcrFailure.outputLimitExceeded
            }
            lines.append("Page \(pageIndex + 1)")
            lines.append(contentsOf: pageLines)
        }
    }
    return lines
}

guard CommandLine.arguments.count == 4 else {
    throw OcrFailure.invalidArguments
}

let inputUrl = URL(fileURLWithPath: CommandLine.arguments[1])
let mediaType = CommandLine.arguments[2]
let outputUrl = URL(fileURLWithPath: CommandLine.arguments[3])
let lines = mediaType == "application/pdf"
    ? try recognizePdf(at: inputUrl)
    : try recognizeImage(at: inputUrl)
let text = lines.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
try text.write(to: outputUrl, atomically: true, encoding: .utf8)
