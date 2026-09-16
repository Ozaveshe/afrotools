# CV automatic split avoidance — bounded repair

The EN Lagos long fixture reproduced three actual PDF cuts through marked blocks that each fit on a page. The previous implementation added CSS print-break classes but the raster paginator did not use their geometry.

The capture now records block intervals. Automatic cuts move before fitting blocks, including overlapping columns. Oversized blocks can continue across pages, and a block already continued from a preceding page cannot send the cut backwards. Explicit manual breaks retain priority. Every source image row is retained; content is not shortened or hidden.

Six pure tests pass for fitting, oversized, overlapping and continued blocks, disabled behavior and contiguous coverage. Three Chromium cases at 320px pass with six actual EN/FR/SW long PDFs (Lagos and Cape Town): no eligible fitting block crosses an automatic boundary, final marker survives capture, and actual image transforms stay inside A4. The SW Lagos first page was rendered and inspected: three complete work entries end before the next page. Artifacts are preserved in ../cv-auto-split-fixed-proof.

This changes default automatic pagination. The prior 120-artifact hashes remain historical proof and must not be called a fresh sweep of this paginator. Representative six-output verification does not certify every template/mode combination. Broader family print evidence is continuing separately. No deployment or whole-CV acceptance is claimed.
