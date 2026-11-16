import type { AppDoc, GeneratedFile } from '@/core/types';
import { dartString } from './helpers';

/**
 * Support files written into lib/backend/ of a Flutter export.
 * backend.dart is always written (it holds fill(), AuthGuard and the Backend
 * class); the others only when the app uses them.
 */

const FILL_AND_GUARD = `/// Fills {{field}} placeholders from a data-list row, and {{user.email}}
/// from the signed-in user.
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
      await Supabase.initialize(url: url, anonKey: key);
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
  if (e is AuthException) return e.message;
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
  const DataList({super.key, required this.load, required this.itemBuilder, this.emptyText = 'Nothing here yet.'});

  final Future<List<Map<String, dynamic>>> Function() load;
  final Widget Function(BuildContext context, Map<String, dynamic> item) itemBuilder;
  final String emptyText;

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
        final rows = snap.data ?? const <Map<String, dynamic>>[];
        if (rows.isEmpty) {
          return Padding(padding: const EdgeInsets.all(16), child: Text(widget.emptyText, textAlign: TextAlign.center));
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 12,
          children: [for (final row in rows) widget.itemBuilder(context, row)],
        );
      },
    );
  }
}
`;

const PAGE_ACTIONS = `import 'package:flutter/material.dart';

import 'backend.dart';

/// Form values and button actions for pages with fields, sign-in or saving.
mixin PageActions<T extends StatefulWidget> on State<T> {
  final Map<String, TextEditingController> _fields = {};

  /// Values from checkboxes, switches and dropdowns, by field name.
  final Map<String, dynamic> values = {};

  bool busy = false;

  /// Controller for the text field saved as [key].
  TextEditingController field(String key) => _fields.putIfAbsent(key, TextEditingController.new);

  /// Text typed into the field saved as [key].
  String text(String key) => _fields[key]?.text.trim() ?? '';

  /// Every value on the page, ready to save. Password fields are never included.
  Map<String, dynamic> collect() => {
        for (final e in _fields.entries)
          if (!e.key.contains('password')) e.key: e.value.text.trim(),
        ...values,
      };

  /// Runs [task], shows [message] or the error, then optionally opens [goTo].
  Future<void> run(Future<void> Function() task, {String? goTo, String? message, bool clear = true}) async {
    if (busy) return;
    setState(() => busy = true);
    try {
      await task();
      if (!mounted) return;
      if (message != null) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      if (goTo != null) {
        if (clear) {
          Navigator.of(context).pushNamedAndRemoveUntil(goTo, (route) => false);
        } else {
          Navigator.of(context).pushNamed(goTo);
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(friendlyError(e))));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  void dispose() {
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
