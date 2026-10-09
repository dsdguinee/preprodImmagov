 public function getDocument(Request $request,$id){

        if($request->isMethod('get')){

            $procedure = ProcedureBesc::find($id);
            if($procedure){
                $zip = new ZipArchive;
                $fileName = 'temp/'.Str::random(16).'.zip';

                if ($zip->open(public_path($fileName), ZipArchive::CREATE) === TRUE) {

                    $files = public_path('storage/');
                    $connaissement = $files.''. $procedure->connaissement;
                    $facture_commerciale = $files.''. $procedure->facture_commerciale;
                    $declaration_exportation = $files.''. $procedure->declaration_exportation;

                    if (file_exists($connaissement)){
                        $extensions = explode('.',  basename($connaissement));
                        $file = 'connaisement'.'.'.$extensions[1];
                        $zip->addFile($connaissement, $file);
                    }
                    if (file_exists($facture_commerciale)){
                        $extensions = explode('.',  basename($facture_commerciale));
                        $file = 'facture_commercial'.'.'.$extensions[1];
                        $zip->addFile($facture_commerciale, $file);
                    }
                    if (file_exists($declaration_exportation)){
                        $extensions = explode('.',  basename($declaration_exportation));
                        $file = 'declartation_exportation'.'.'.$extensions[1];
                        $zip->addFile($declaration_exportation, $file);
                    }

                    $zip->close();
               }

               //return response()->download($fileName);

               //dd($fileName);
                return response()->json([
                    'status' => Response::HTTP_OK,
                    'path' => $fileName,
                    'success' => true,
                ]);
            }
        }
    }