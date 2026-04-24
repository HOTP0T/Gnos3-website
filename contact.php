<?php
// GNOS3 contact form handler.
// Receives POST from index.html, emails max@gnos3.com via PHP mail() → Sendmail
// → Station194 SMTP (SPF authorises station194.smtp-spf.sureserver.com for
// gnos3.com, so delivery should authenticate properly).

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

// --- config -----------------------------------------------------------------
$TO       = 'max@gnos3.com';
$FROM     = 'noreply@gnos3.com';          // must be on the domain for SPF to pass
$SUBJECT  = 'GNOS3 · New contact request';

// Optional: shared secret to prove the request came from our own form.
// Set this to any string and mirror it in the form's fetch call.
$EXPECTED_TOKEN = 'gnos3-public-form';

// --- helpers ----------------------------------------------------------------
function reject(int $status, string $message): never {
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

function clean(string $v, int $max = 500): string {
    $v = trim($v);
    $v = str_replace(["\r", "\n", "\0"], ' ', $v);   // strip header-injection chars
    if (strlen($v) > $max) $v = substr($v, 0, $max);
    return $v;
}

function cleanMultiline(string $v, int $max = 4000): string {
    $v = trim($v);
    $v = preg_replace("/\r\n?/", "\n", $v);
    $v = str_replace("\0", '', $v);
    if (strlen($v) > $max) $v = substr($v, 0, $max);
    return $v;
}

// --- method + token ---------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    reject(405, 'Method not allowed');
}

if (($_POST['token'] ?? '') !== $EXPECTED_TOKEN) {
    reject(400, 'Invalid token');
}

// --- honeypot (bots fill any field named "website" — real users can't see it) -
if (!empty($_POST['website'] ?? '')) {
    // Pretend it worked so the bot moves on.
    echo json_encode(['ok' => true]);
    exit;
}

// --- field extraction + validation ------------------------------------------
$name     = clean((string)($_POST['name']      ?? ''), 200);
$email    = clean((string)($_POST['email']     ?? ''), 200);
$company  = clean((string)($_POST['company']   ?? ''), 200);
$teamSize = clean((string)($_POST['team_size'] ?? ''), 50);
$useCase  = clean((string)($_POST['use_case']  ?? ''), 50);
$notes    = cleanMultiline((string)($_POST['notes'] ?? ''), 4000);

if ($name === '')  reject(422, 'Name is required');
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    reject(422, 'A valid email is required');
}

// --- build message ----------------------------------------------------------
$lines = [
    "New contact request from the GNOS3 site.",
    "",
    "Name:       $name",
    "Email:      $email",
    "Company:    " . ($company  !== '' ? $company  : '—'),
    "Team size:  " . ($teamSize !== '' ? $teamSize : '—'),
    "Use case:   " . ($useCase  !== '' ? $useCase  : '—'),
    "",
    "Notes:",
    $notes !== '' ? $notes : '—',
    "",
    "—",
    "Submitted: " . gmdate('Y-m-d H:i:s') . ' UTC',
    "IP:        " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
    "User-Agent: " . substr((string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'), 0, 250),
];
$body = implode("\n", $lines);

$headers = [
    "From: GNOS3 site <$FROM>",
    "Reply-To: " . (filter_var($email, FILTER_VALIDATE_EMAIL) ? "$name <$email>" : $FROM),
    "Return-Path: $FROM",
    "X-Mailer: PHP/" . PHP_VERSION,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
];

$ok = @mail($TO, $SUBJECT, $body, implode("\r\n", $headers), "-f$FROM");

if (!$ok) {
    error_log('[contact.php] mail() failed for ' . $email);
    reject(500, 'Could not send the message. Please email max@gnos3.com directly.');
}

echo json_encode(['ok' => true]);
