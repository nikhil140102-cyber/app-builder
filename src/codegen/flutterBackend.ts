import type { AppDoc, GeneratedFile } from '@/core/types';
import { dartString } from './helpers';

/**
 * Support files written into lib/backend/ of a Flutter export.
 * backend.dart is always written (it holds fill(), AuthGuard and the Backend
 * class); the others only when the app uses them.
 */

const FILL_AND_GUARD = `/// The data-list row this page was opened with (a tapped dish, product…),
/// or null when the page was opened normally.
Map<String, dynamic>? pageItem(BuildContext context) {
  final args = ModalRoute.of(context)?.settings.arguments;
  return args is Map ? Map<String, dynamic>.from(args) : null;
}

/// Fills {{field}} placeholders from a data-list row (or the row this page
/// was opened with), and {{user.email}} from the signed-in user.
String fill(Map<String, dynamic>? item, String template) {
  return template.replaceAllMapped(RegExp(r'\\{\\{\\s*([\\w.]+)\\s*\\}\\}'), (m) {
    final key = m[1]!;
    if (key == 'user.email') return Backend.userEmail ?? '';
    Object? value = item;
    for (final part in key.split('.')) {
      final index = int.tryParse(part);
      if (value is Map) {
        value = value[part];
      } else if (value is List && index != null && index < value.length) {
        value = value[index];
      } else {
        value = null;
      }
    }
    if (value is List) return value.join(', ');
    return value?.toString() ?? '';
  });
}

/// Shows [child] to signed-in users and [login] to everyone else.
class AuthGuard extends StatelessWidget {
  const AuthGuard({super.key, required this.child, this.login});

  final Widget child;
  final Widget? login;

  @override
  Widget build(BuildContext context) => Backend.isSignedIn ? child : (login ?? const SignInRequired());
}

class SignInRequired extends StatelessWidget {
  const SignInRequired({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('Please sign in to see this page.', textAlign: TextAlign.center),
        ),
      ),
    );
  }
}
`;

function supabaseBackend(doc: AppDoc) {
  return `import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Connection to this app's Supabase project. The publishable key is safe in
/// app code: row level security in Supabase decides what each user may read or write.
class Backend {
  static const url = ${dartString(doc.backend.supabaseUrl.trim())};
  static const key = ${dartString(doc.backend.supabaseKey.trim())};
  static Object? initError;

  static Future<void> init() async {
    try {
      // Implicit flow: one-time codes typed in the app are checked directly.
      // (PKCE is only needed for browser redirects, which this app does not use.)
      await Supabase.initialize(
        url: url,
        anonKey: key,
        authOptions: const FlutterAuthClientOptions(authFlowType: AuthFlowType.implicit),
      );
    } catch (e) {
      initError = e;
    }
  }

  static SupabaseClient get _db {
    if (initError != null) throw Exception('Could not connect to Supabase: $initError');
    return Supabase.instance.client;
  }

  static bool get isSignedIn {
    try {
      return _db.auth.currentUser != null;
    } catch (_) {
      return false;
    }
  }

  static String? get userEmail {
    try {
      return _db.auth.currentUser?.email;
    } catch (_) {
      return null;
    }
  }

  static Future<void> signIn(String email, String password) async {
    await _db.auth.signInWithPassword(email: email, password: password);
  }

  static Future<void> signUp(String email, String password, {String name = ''}) async {
    final res = await _db.auth.signUp(email: email, password: password, data: {'full_name': name});
    if (res.session == null) {
      throw Exception('Account created. Open the confirmation email, then sign in.');
    }
  }

  static Future<void> signOut() async {
    await _db.auth.signOut();
  }

  // One-time codes (OTP). The email or phone is remembered between the
  // "Send code" and "Verify" pages.
  static String? _pending;
  static bool _pendingPhone = false;

  static Future<void> sendCode(String contact, {bool phone = false}) async {
    final to = contact.isNotEmpty ? contact : (_pending ?? '');
    if (to.isEmpty) throw Exception(phone ? 'Enter your phone number with country code, e.g. +91…' : 'Enter your email address.');
    if (phone) {
      await _db.auth.signInWithOtp(phone: to);
    } else {
      await _db.auth.signInWithOtp(email: to);
    }
    _pending = to;
    _pendingPhone = phone;
  }

  static Future<void> verifyCode(String code, {String contact = '', bool phone = false}) async {
    code = code.replaceAll(RegExp(r'[^0-9]'), '');
    final to = contact.isNotEmpty ? contact : _pending;
    final byPhone = contact.isNotEmpty ? phone : _pendingPhone;
    if (to == null || to.isEmpty) throw Exception('Tap "Send code" first.');
    if (code.length < 4) throw Exception(byPhone ? 'Enter the code from the SMS.' : 'Enter the code from the email.');
    if (byPhone) {
      await _db.auth.verifyOTP(type: OtpType.sms, phone: to, token: code);
    } else {
      await _db.auth.verifyOTP(type: OtpType.email, email: to, token: code);
    }
  }

  static Future<List<Map<String, dynamic>>> list(String table, {int limit = 50}) async {
    final rows = await _db.from(table).select().limit(limit);
    return List<Map<String, dynamic>>.from(rows);
  }

  static Future<void> insert(String table, Map<String, dynamic> data) async {
    await _db.from(table).insert(data);
  }
}

String friendlyError(Object e) {
  if (e is AuthException) {
    final m = e.message;
    if (RegExp('error sending', caseSensitive: false).hasMatch(m)) {
      return 'Supabase could not send the email. Check Authentication → Emails → SMTP settings (host, port 587, Gmail app password).';
    }
    if (RegExp('expired or is invalid', caseSensitive: false).hasMatch(m)) {
      return 'That code is wrong or too old. Use the code from the NEWEST email only (each "Send code" replaces the last one), or tap Send code again.';
    }
    if (RegExp('rate limit', caseSensitive: false).hasMatch(m)) {
      return 'Too many codes were requested. Wait a few minutes and try again.';
    }
    return m;
  }
  if (e is PostgrestException) return e.message;
  return e.toString().replaceFirst('Exception: ', '');
}

${FILL_AND_GUARD}`;
}

function firebaseBackend() {
  return `import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import '../firebase_options.dart';

/// Connection to this app's Firebase project (Authentication + Firestore).
/// lib/firebase_options.dart is created by "flutterfire configure" (run_windows.bat does it).
class Backend {
  static Object? initError;

  static Future<void> init() async {
    try {
      await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    } catch (e) {
      initError = e;
    }
  }

  static void _check() {
    if (initError != null) throw Exception('Could not connect to Firebase: $initError');
  }

  static bool get isSignedIn {
    try {
      return FirebaseAuth.instance.currentUser != null;
    } catch (_) {
      return false;
    }
  }

  static String? get userEmail {
    try {
      return FirebaseAuth.instance.currentUser?.email;
    } catch (_) {
      return null;
    }
  }

  static Future<void> signIn(String email, String password) async {
    _check();
    await FirebaseAuth.instance.signInWithEmailAndPassword(email: email, password: password);
  }

  static Future<void> signUp(String email, String password, {String name = ''}) async {
    _check();
    final cred = await FirebaseAuth.instance.createUserWithEmailAndPassword(email: email, password: password);
    if (name.isNotEmpty) await cred.user?.updateDisplayName(name);
  }

  static Future<void> signOut() async {
    _check();
    await FirebaseAuth.instance.signOut();
  }

  // One-time codes (OTP). Firebase sends codes by SMS only.
  static String? _verificationId;
  static String? _pending;

  static Future<void> sendCode(String contact, {bool phone = false}) async {
    _check();
    if (!phone) throw Exception('Firebase sends sign-in codes by SMS only. Choose "SMS" for this button, or use Supabase for email codes.');
    final to = contact.isNotEmpty ? contact : (_pending ?? '');
    if (!to.startsWith('+')) throw Exception('Enter the phone number with country code, e.g. +919876543210.');
    final sent = Completer<void>();
    await FirebaseAuth.instance.verifyPhoneNumber(
      phoneNumber: to,
      verificationCompleted: (credential) async {
        await FirebaseAuth.instance.signInWithCredential(credential);
      },
      verificationFailed: (e) {
        if (!sent.isCompleted) sent.completeError(e);
      },
      codeSent: (id, _) {
        _verificationId = id;
        if (!sent.isCompleted) sent.complete();
      },
      codeAutoRetrievalTimeout: (id) => _verificationId = id,
    );
    _pending = to;
    return sent.future;
  }

  static Future<void> verifyCode(String code, {String contact = '', bool phone = false}) async {
    _check();
    code = code.replaceAll(RegExp(r'[^0-9]'), '');
    final id = _verificationId;
    if (id == null) throw Exception('Tap "Send code" first.');
    if (code.length < 6) throw Exception('Enter the 6-digit code from the SMS.');
    await FirebaseAuth.instance.signInWithCredential(PhoneAuthProvider.credential(verificationId: id, smsCode: code));
  }

  static Future<List<Map<String, dynamic>>> list(String collection, {int limit = 50}) async {
    _check();
    final snap = await FirebaseFirestore.instance.collection(collection).limit(limit).get();
    return [for (final doc in snap.docs) {'id': doc.id, ...doc.data()}];
  }

  static Future<void> insert(String collection, Map<String, dynamic> data) async {
    _check();
    final user = FirebaseAuth.instance.currentUser;
    await FirebaseFirestore.instance.collection(collection).add({
      ...data,
      'created_at': FieldValue.serverTimestamp(),
      if (user != null) 'user_id': user.uid,
    });
  }
}

String friendlyError(Object e) {
  if (e is FirebaseAuthException) return e.message ?? e.code;
  if (e is FirebaseException) return e.message ?? e.code;
  return e.toString().replaceFirst('Exception: ', '');
}

${FILL_AND_GUARD}`;
}

function noBackend() {
  return `import 'package:flutter/material.dart';

/// No backend is connected. Choose Supabase or Firebase in the builder
/// (App → Backend) to make sign-in and saving work.
class Backend {
  static Future<void> init() async {}

  static bool get isSignedIn => false;

  static String? get userEmail => null;

  static Never _missing() => throw Exception('No backend connected. Choose Supabase or Firebase under App → Backend in the builder.');

  static Future<void> signIn(String email, String password) async => _missing();

  static Future<void> signUp(String email, String password, {String name = ''}) async => _missing();

  static Future<void> signOut() async => _missing();

  static Future<void> sendCode(String contact, {bool phone = false}) async => _missing();

  static Future<void> verifyCode(String code, {String contact = '', bool phone = false}) async => _missing();

  static Future<List<Map<String, dynamic>>> list(String table, {int limit = 50}) async => _missing();

  static Future<void> insert(String table, Map<String, dynamic> data) async => _missing();
}

String friendlyError(Object e) => e.toString().replaceFirst('Exception: ', '');

${FILL_AND_GUARD}`;
}

const API = `import 'dart:convert';

import 'package:http/http.dart' as http;

/// Calls REST APIs set up in the builder (App → APIs).
class Api {
  /// GETs [url] and returns the list found at [listPath] (e.g. "data.items").
  static Future<List<Map<String, dynamic>>> getList(String url, String listPath, {int limit = 50}) async {
    final res = await http.get(Uri.parse(url));
    if (res.statusCode >= 400) throw Exception('The server answered \${res.statusCode}.');
    Object? data = jsonDecode(res.body);
    for (final part in listPath.split('.').where((p) => p.isNotEmpty)) {
      data = data is Map ? data[part] : null;
    }
    if (data is! List) return [];
    return [
      for (final row in data.take(limit)) row is Map ? Map<String, dynamic>.from(row) : {'value': row},
    ];
  }

  /// POSTs [body] as JSON to [url].
  static Future<void> post(String url, Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse(url),
      headers: {'content-type': 'application/json'},
      body: jsonEncode(body),
    );
    if (res.statusCode >= 400) throw Exception('The server answered \${res.statusCode}.');
  }
}
`;

const DATA_LIST = `import 'package:flutter/material.dart';

import 'backend.dart';

/// Loads rows once and builds [itemBuilder] for each, with loading, error and empty states.
class DataList extends StatefulWidget {
  const DataList({super.key, required this.load, required this.itemBuilder, this.emptyText = 'Nothing here yet.', this.filter, this.listen});

  final Future<List<Map<String, dynamic>>> Function() load;
  final Widget Function(BuildContext context, Map<String, dynamic> item) itemBuilder;
  final String emptyText;

  /// Keeps only rows that pass (search box, dropdown or filter chips on the page).
  final bool Function(Map<String, dynamic> row)? filter;

  /// Re-filters when this changes (the page's form fields).
  final Listenable? listen;

  @override
  State<DataList> createState() => _DataListState();
}

class _DataListState extends State<DataList> {
  late Future<List<Map<String, dynamic>>> future = widget.load();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator()));
        }
        if (snap.hasError) {
          return Column(
            children: [
              Text(friendlyError(snap.error!), textAlign: TextAlign.center),
              TextButton(onPressed: () => setState(() => future = widget.load()), child: const Text('Try again')),
            ],
          );
        }
        final all = snap.data ?? const <Map<String, dynamic>>[];
        if (all.isEmpty) {
          return Padding(padding: const EdgeInsets.all(16), child: Text(widget.emptyText, textAlign: TextAlign.center));
        }
        Widget list(BuildContext context) {
          final rows = widget.filter == null ? all : all.where(widget.filter!).toList();
          if (rows.isEmpty) {
            return const Padding(padding: EdgeInsets.all(16), child: Text('No matches. Try another search or filter.', textAlign: TextAlign.center));
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [for (final row in rows) widget.itemBuilder(context, row)],
          );
        }

        final listen = widget.listen;
        return listen == null ? list(context) : ListenableBuilder(listenable: listen, builder: (context, _) => list(context));
      },
    );
  }
}

/// True if [row] matches every search text / filter value in [queries].
/// Looks in the row fields named in [keys] (all fields when empty).
/// Empty values, and values starting with "All" (e.g. "All categories"), match everything.
bool rowMatches(Map<String, dynamic> row, List<String> queries, List<String> keys) {
  final parts = keys.isEmpty ? row.values.map((v) => v?.toString() ?? '') : keys.map((k) => fill(row, '{{\$k}}'));
  final haystack = parts.join(' ').toLowerCase();
  for (final q in queries) {
    final t = q.trim().toLowerCase();
    if (t.isEmpty || t == 'all' || t.startsWith('all ')) continue;
    if (!haystack.contains(t)) return false;
  }
  return true;
}
`;

const PAGE_ACTIONS = `import 'dart:async';

import 'package:flutter/material.dart';

import 'backend.dart';

/// Form values and button actions for pages with fields, sign-in or saving.
mixin PageActions<T extends StatefulWidget> on State<T> {
  final Map<String, TextEditingController> _fields = {};

  /// Values from checkboxes, switches, dropdowns and filter chips, by field name.
  final Map<String, dynamic> values = {};

  /// Ticks whenever a field changes, so Data lists can re-filter as you type.
  final ValueNotifier<int> changes = ValueNotifier(0);

  bool busy = false;

  void _changed() => Future.microtask(() {
        if (mounted) changes.value++;
      });

  /// Controller for the text field saved as [key].
  TextEditingController field(String key) => _fields.putIfAbsent(key, () => TextEditingController()..addListener(_changed));

  /// Sets a dropdown / switch / filter value and updates lists that filter by it.
  void setValue(String key, dynamic value) {
    values[key] = value;
    _changed();
  }

  /// The current value of the field saved as [key] (text box, dropdown or filter chip).
  String value(String key) => _fields[key]?.text.trim() ?? values[key]?.toString() ?? '';

  /// True when the filter [key] is set to [option] (an empty / "All…" option is on when nothing is chosen).
  bool isFilterOn(String key, String option) {
    bool isAll(String v) => v.isEmpty || v == 'all' || v.startsWith('all ');
    final current = value(key).trim().toLowerCase();
    final wanted = option.trim().toLowerCase();
    return isAll(wanted) ? isAll(current) : current == wanted;
  }

  /// Text typed into the field saved as [key].
  String text(String key) => _fields[key]?.text.trim() ?? '';

  /// Every value on the page, ready to save. Password fields are never included.
  Map<String, dynamic> collect() => {
        for (final e in _fields.entries)
          if (!e.key.contains('password')) e.key: e.value.text.trim(),
        ...values,
      };

  /// Runs [task], shows [message] or the error, then optionally opens [goTo].
  /// A "Please wait…" note shows at once, and the task gives up after 60 seconds
  /// so a button never seems to do nothing.
  Future<void> run(Future<void> Function() task, {String? goTo, String? message, bool clear = true}) async {
    if (busy) return;
    setState(() => busy = true);
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(const SnackBar(
      content: Row(children: [
        SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
        SizedBox(width: 12),
        Text('Please wait…'),
      ]),
      duration: Duration(seconds: 60),
    ));
    try {
      await task().timeout(const Duration(seconds: 60));
      if (!mounted) return;
      messenger.hideCurrentSnackBar();
      if (message != null) messenger.showSnackBar(SnackBar(content: Text(message)));
      if (goTo != null) {
        if (clear) {
          Navigator.of(context).pushNamedAndRemoveUntil(goTo, (route) => false);
        } else {
          Navigator.of(context).pushNamed(goTo);
        }
      }
    } catch (e) {
      debugPrint('Action failed: $e');
      if (mounted) {
        messenger.hideCurrentSnackBar();
        messenger.showSnackBar(SnackBar(content: Text(_explain(e)), duration: const Duration(seconds: 8)));
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  String _explain(Object e) {
    if (e is TimeoutException) {
      return 'No answer from the server after 60 seconds. Check the internet connection. For email codes, also check the SMTP settings in your backend.';
    }
    final raw = e.toString();
    if (RegExp(r'SocketException|Failed host lookup|ClientException|Connection (refused|reset|closed)', caseSensitive: false).hasMatch(raw)) {
      return 'No internet connection. Check that this phone or emulator is online, then try again.';
    }
    return friendlyError(e);
  }

  @override
  void dispose() {
    changes.dispose();
    for (final c in _fields.values) {
      c.dispose();
    }
    super.dispose();
  }
}
`;

export function backendFiles(doc: AppDoc, opts: { api: boolean; dataList: boolean; pageActions: boolean }): GeneratedFile[] {
  const p = doc.backend.provider;
  const files: GeneratedFile[] = [
    { path: 'lib/backend/backend.dart', content: p === 'supabase' ? supabaseBackend(doc) : p === 'firebase' ? firebaseBackend() : noBackend() },
  ];
  if (opts.api) files.push({ path: 'lib/backend/api.dart', content: API });
  if (opts.dataList) files.push({ path: 'lib/backend/data_list.dart', content: DATA_LIST });
  if (opts.pageActions) files.push({ path: 'lib/backend/page_actions.dart', content: PAGE_ACTIONS });
  return files;
}

/** Packages the generated app needs, by provider and features. Versions are chosen by "flutter pub get". */
export function backendPackages(doc: AppDoc, opts: { api: boolean }): string[] {
  const out: string[] = [];
  if (doc.backend.provider === 'supabase') out.push('supabase_flutter');
  if (doc.backend.provider === 'firebase') out.push('firebase_core', 'firebase_auth', 'cloud_firestore');
  if (opts.api) out.push('http');
  return out;
}
